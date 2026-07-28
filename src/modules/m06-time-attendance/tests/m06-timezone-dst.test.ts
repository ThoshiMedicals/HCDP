import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import {
  clearClinicTimezoneOverridesForTests,
  registerClinicTimezone,
  clinicCalendarDate,
} from "@/platform/workforce/services/clinic-timezone";
import {
  crossesLocalMidnight,
  resolveLocalInstant,
  testOnlyResolveOffsetForWallTime,
} from "../services/clinic-time-service";
import { installMemoryLocalStorage } from "./_helpers";

describe("m06 timezone / DST", () => {
  beforeEach(() => {
    installMemoryLocalStorage();
    clearClinicTimezoneOverridesForTests();
  });

  it("TZ-01: Brisbane cross-midnight civil dates differ", () => {
    registerClinicTimezone("clinic_ov", "Australia/Brisbane");
    const start = resolveLocalInstant("clinic_ov", "2026-08-05T22:00");
    const end = resolveLocalInstant("clinic_ov", "2026-08-06T06:00");
    assert.ok(start.ok && end.ok);
    if (!start.ok || !end.ok) return;
    assert.equal(crossesLocalMidnight(start.instant.localCivil, end.instant.localCivil), true);
    assert.equal(start.instant.occurredAtUtc, "2026-08-05T12:00:00.000Z");
    assert.equal(end.instant.occurredAtUtc, "2026-08-05T20:00:00.000Z");
  });

  it("TZ-02: clinic calendar date differs from UTC", () => {
    const asOf = "2026-07-27T12:30:00.000Z";
    assert.notEqual(asOf.slice(0, 10), clinicCalendarDate(asOf, "Pacific/Auckland"));
  });

  it("TZ-03: DST spring-forward gap unresolved", () => {
    registerClinicTimezone("clinic_us", "America/New_York");
    const r = resolveLocalInstant("clinic_us", "2026-03-08T02:30");
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.reason, "dst-gap");
  });

  it("TZ-04: fall-back fold=0 earlier", () => {
    registerClinicTimezone("clinic_us", "America/New_York");
    const r = testOnlyResolveOffsetForWallTime("clinic_us", "2026-11-01", "01:30", 0);
    assert.ok(r.ok);
  });

  it("TZ-05: fall-back fold=1 later", () => {
    registerClinicTimezone("clinic_us", "America/New_York");
    const early = testOnlyResolveOffsetForWallTime("clinic_us", "2026-11-01", "01:30", 0);
    const later = testOnlyResolveOffsetForWallTime("clinic_us", "2026-11-01", "01:30", 1);
    assert.ok(early.ok && later.ok);
    if (early.ok && later.ok) assert.notEqual(early.offsetMinutes, later.offsetMinutes);
  });

  it("TZ-06: device skew recorded", () => {
    registerClinicTimezone("clinic_ov", "Australia/Brisbane");
    const r = resolveLocalInstant("clinic_ov", "2026-07-28T09:00", 0, {
      deviceReportedAt: "2026-07-28T00:00:00.000Z",
      receivedAt: "2026-07-28T00:30:00.000Z",
      skewWarnMinutes: 10,
    });
    assert.ok(r.ok);
    if (r.ok) assert.ok(typeof r.instant.deviceSkewMinutes === "number");
  });

  it("TZ-07: stale timezone unresolved", () => {
    registerClinicTimezone("clinic_ov", "Australia/Brisbane");
    const r = resolveLocalInstant("clinic_ov", "2026-07-28T09:00", 0, {
      expectedTimeZoneId: "Pacific/Auckland",
    });
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.reason, "stale-timezone");
  });

  it("TZ-08: invalid clinic timezone unresolved — no silent UTC", () => {
    const r = resolveLocalInstant("clinic_missing_tz_xxx", "2026-07-28T09:00");
    assert.equal(r.ok, false);
    if (!r.ok) assert.notEqual(r.reason, undefined);
  });
});
