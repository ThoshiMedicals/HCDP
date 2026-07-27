/**
 * Clinic timezone / DST resolution — TZ-01…TZ-08 (§4 of the plan).
 *
 * TZ-01  Cross-midnight shifts (local end date after start date; UTC OK)
 * TZ-02  Clinic calendar date differs from UTC date for same instant
 * TZ-03  DST spring-forward gap → unresolved with `dst-gap`
 * TZ-04  DST fall-back repeated local hour stored with fold
 * TZ-05  Explicit repeated-hour fold selection round-trips
 * TZ-06  Two clinics in different IANA TZs → different canonical UTC instants
 *        for the same local wall time
 * TZ-07  Deterministic recalculation for the same `asOf`
 * TZ-08  Invalid / unavailable timezone → explainable unresolved; no silent UTC
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";

import {
  clearClinicTimezoneOverridesForTests,
  registerClinicTimezone,
  clinicCalendarDate,
} from "@/platform/workforce/services/clinic-timezone";

import {
  resolveLocalShiftWindow,
  testOnlyResolveOffsetForWallTime,
} from "../services/clinic-time-service";

function installMemoryLocalStorage() {
  const map = new Map<string, string>();
  (globalThis as { window?: { localStorage: Storage } }).window = {
    localStorage: {
      getItem: (k) => (map.has(k) ? map.get(k)! : null),
      setItem: (k, v) => {
        map.set(k, String(v));
      },
      removeItem: (k) => {
        map.delete(k);
      },
      clear: () => map.clear(),
      key: () => null,
      length: 0,
    } as Storage,
  };
}

describe("m05 timezone / DST", () => {
  beforeEach(() => {
    installMemoryLocalStorage();
    clearClinicTimezoneOverridesForTests();
  });

  it("TZ-01: cross-midnight shift keeps localEnd date > localStart date and computes UTC correctly", () => {
    registerClinicTimezone("clinic_ov", "Australia/Brisbane"); // UTC+10, no DST
    const result = resolveLocalShiftWindow(
      "clinic_ov",
      "2026-08-05",
      "22:00",
      "2026-08-06",
      "06:00"
    );
    assert.ok(result.ok, "cross-midnight window must resolve");
    if (!result.ok) return;
    assert.equal(result.window.crossesLocalMidnight, true);
    assert.equal(result.window.utcStart, "2026-08-05T12:00:00.000Z");
    assert.equal(result.window.utcEnd, "2026-08-05T20:00:00.000Z");
    assert.equal(result.window.startOffsetMinutes, 600);
    assert.equal(result.window.endOffsetMinutes, 600);
  });

  it("TZ-02: clinic-calendar date differs from UTC for the same instant (Pacific/Auckland)", () => {
    // 2026-07-27T12:30:00Z is still 27-Jul UTC but 28-Jul in Auckland (+12).
    const asOf = "2026-07-27T12:30:00.000Z";
    const utcDay = asOf.slice(0, 10);
    const akDay = clinicCalendarDate(asOf, "Pacific/Auckland");
    assert.equal(utcDay, "2026-07-27");
    assert.equal(akDay, "2026-07-28");
    assert.notEqual(utcDay, akDay);
  });

  it("TZ-03: DST spring-forward gap → unresolved with reason `dst-gap`", () => {
    // Australia/Sydney switches to AEDT on 2026-10-04 at 02:00 → 03:00.
    // 02:30 local does not exist on that date.
    registerClinicTimezone("clinic_sydney", "Australia/Sydney");
    const result = resolveLocalShiftWindow(
      "clinic_sydney",
      "2026-10-04",
      "02:30",
      "2026-10-04",
      "10:00"
    );
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "dst-gap");
      assert.match(result.message, /DST/i);
    }
  });

  it("TZ-04: DST fall-back repeated hour stored with fold (default fold=0 → earlier)", () => {
    // Australia/Sydney switches back on 2026-04-05 at 03:00 → 02:00.
    // 02:30 local occurs twice on that date.
    registerClinicTimezone("clinic_sydney", "Australia/Sydney");
    const r0 = resolveLocalShiftWindow(
      "clinic_sydney",
      "2026-04-05",
      "02:30",
      "2026-04-05",
      "04:00"
    );
    assert.ok(r0.ok);
    if (!r0.ok) return;
    // Earlier occurrence: offset should be +660 (still AEDT) at 02:30 local
    assert.equal(r0.window.startFold, 0);
    assert.equal(r0.window.startOffsetMinutes, 660);
    // End at 04:00 is unambiguous (AEST +600)
    assert.equal(r0.window.endOffsetMinutes, 600);
  });

  it("TZ-05: explicit fold=1 selects the LATER occurrence of the repeated local hour", () => {
    registerClinicTimezone("clinic_sydney", "Australia/Sydney");
    const r0 = resolveLocalShiftWindow(
      "clinic_sydney",
      "2026-04-05",
      "02:30",
      "2026-04-05",
      "04:00",
      { start: 0 }
    );
    const r1 = resolveLocalShiftWindow(
      "clinic_sydney",
      "2026-04-05",
      "02:30",
      "2026-04-05",
      "04:00",
      { start: 1 }
    );
    assert.ok(r0.ok && r1.ok);
    if (!r0.ok || !r1.ok) return;
    assert.notEqual(r0.window.utcStart, r1.window.utcStart);
    // Later occurrence should be one hour after the earlier one
    const diffMs =
      new Date(r1.window.utcStart).getTime() - new Date(r0.window.utcStart).getTime();
    assert.equal(diffMs, 60 * 60 * 1000);
    assert.equal(r0.window.startFold, 0);
    assert.equal(r1.window.startFold, 1);

    const offsetEarlier = testOnlyResolveOffsetForWallTime(
      "clinic_sydney",
      "2026-04-05",
      "02:30",
      0
    );
    const offsetLater = testOnlyResolveOffsetForWallTime(
      "clinic_sydney",
      "2026-04-05",
      "02:30",
      1
    );
    assert.ok(offsetEarlier.ok && offsetLater.ok);
    if (offsetEarlier.ok && offsetLater.ok) {
      assert.equal(offsetEarlier.offsetMinutes, 660);
      assert.equal(offsetLater.offsetMinutes, 600);
    }
  });

  it("TZ-06: two clinics in different IANA TZs produce different UTC instants for the same wall time", () => {
    registerClinicTimezone("clinic_bne", "Australia/Brisbane"); // +10
    registerClinicTimezone("clinic_la", "America/Los_Angeles"); // -7/-8
    const r1 = resolveLocalShiftWindow(
      "clinic_bne",
      "2026-06-15",
      "09:00",
      "2026-06-15",
      "17:00"
    );
    const r2 = resolveLocalShiftWindow(
      "clinic_la",
      "2026-06-15",
      "09:00",
      "2026-06-15",
      "17:00"
    );
    assert.ok(r1.ok && r2.ok);
    if (!r1.ok || !r2.ok) return;
    assert.notEqual(r1.window.utcStart, r2.window.utcStart);
    // BNE = +10 → 09:00 local = 23:00 previous UTC day
    assert.equal(r1.window.utcStart, "2026-06-14T23:00:00.000Z");
    // LA in June is PDT (-7) → 09:00 local = 16:00 UTC same day
    assert.equal(r2.window.utcStart, "2026-06-15T16:00:00.000Z");
  });

  it("TZ-07: same asOf produces deterministic resolved window", () => {
    registerClinicTimezone("clinic_bne", "Australia/Brisbane");
    const args = ["clinic_bne", "2026-08-01", "08:00", "2026-08-01", "16:00"] as const;
    const a = resolveLocalShiftWindow(...args);
    const b = resolveLocalShiftWindow(...args);
    assert.ok(a.ok && b.ok);
    if (a.ok && b.ok) {
      assert.deepEqual(a.window, b.window);
    }
  });

  it("TZ-08: invalid / unavailable timezone → explainable unresolved; NO silent UTC", () => {
    const missing = resolveLocalShiftWindow(
      "no_such_clinic",
      "2026-08-01",
      "08:00",
      "2026-08-01",
      "16:00"
    );
    assert.equal(missing.ok, false);
    if (!missing.ok) {
      assert.equal(missing.reason, "clinic-timezone-unresolved");
      assert.ok(missing.message.length > 0);
    }
    const emptyClinic = resolveLocalShiftWindow(
      "",
      "2026-08-01",
      "08:00",
      "2026-08-01",
      "16:00"
    );
    assert.equal(emptyClinic.ok, false);
    if (!emptyClinic.ok) {
      assert.equal(emptyClinic.reason, "clinic-missing");
    }
  });

  it("invalid local time format → `invalid-local-time` reason (defensive)", () => {
    registerClinicTimezone("clinic_bne", "Australia/Brisbane");
    // Bad format entirely (missing the T separator): the regex must reject.
    const bad = resolveLocalShiftWindow("clinic_bne", "not-a-date", "08:00", "2026-08-01", "16:00");
    assert.equal(bad.ok, false);
    if (!bad.ok) {
      assert.equal(bad.reason, "invalid-local-time");
    }
  });

  it("end must fall after start in same TZ (not end-before-start)", () => {
    registerClinicTimezone("clinic_bne", "Australia/Brisbane");
    const bad = resolveLocalShiftWindow(
      "clinic_bne",
      "2026-08-01",
      "16:00",
      "2026-08-01",
      "08:00"
    );
    assert.equal(bad.ok, false);
    if (!bad.ok) {
      assert.equal(bad.reason, "end-before-start");
    }
  });
});
