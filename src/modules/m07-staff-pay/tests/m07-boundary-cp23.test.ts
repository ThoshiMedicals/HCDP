/**
 * Checkpoint 2.3 — static + behavioural boundary tests for M07 ↔ M06 isolation.
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { publishTimesheetVersion } from "@/platform/workforce/services/published-timesheet-registry";
import { PUBLISHED_TIMESHEET_REGISTRY_KEYS } from "@/platform/workforce/services/published-timesheet-registry";
import { writeJsonSafe } from "@/platform/storage/storage";

import { resetM07TestEnv, ORG_A, ORG_B, CLINIC_A } from "./_helpers";
import {
  discoverPublishedTimesheets,
  getDiscoveredPublication,
  getM07TimesheetIntakeBlockerStatus,
  linkApprovedTimesheetToPeriod,
  listApprovedTimesheetRefs,
  M07_PUBLISHED_TIMESHEET_DISCOVERY_SOURCE,
  M07_INTAKE_BATCH1_STATUS,
} from "../adapters/m06-timesheet-read";
import { createTimesheetRef } from "@/platform/workforce/contracts/timesheet-ref";

const M07_ROOT = join(process.cwd(), "src/modules/m07-staff-pay");
const LE_A = "le_pay_a";
const LE_B = "le_pay_b";

function walkProductionTsFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "tests" || name === "node_modules") continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walkProductionTsFiles(full, out);
    else if (/\.(ts|tsx)$/.test(name) && !name.endsWith(".d.ts")) out.push(full);
  }
  return out;
}

function stripCommentsAndStrings(src: string): string {
  // Remove block comments, line comments, and string/template literals so
  // documentation mentions cannot satisfy or evade import checks.
  return src
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/.*$/gm, " ")
    .replace(/`(?:\\.|[^`\\])*`/g, '""')
    .replace(/'(?:\\.|[^'\\])*'/g, '""')
    .replace(/"(?:\\.|[^"\\])*"/g, '""');
}

function publishFixture(input: {
  organisationId: string;
  legalEntityId: string;
  timesheetRecordId: string;
  clinicId?: string;
  eventId: string;
  sourceVersion?: number;
  contractVersionOverride?: string;
}) {
  const content = {
    timesheetRecordId: input.timesheetRecordId,
    workforcePersonId: "wp_a",
    organisationId: input.organisationId,
    legalEntityId: input.legalEntityId,
    clinicId: input.clinicId ?? CLINIC_A,
    periodStart: "2026-07-01",
    periodEnd: "2026-07-14",
    attendanceSessionIds: ["s1"],
    ordinaryHourInputs: [{ code: "ORD", hours: 76 }],
    overtimeHourInputs: [],
    penaltyHourInputs: [],
    leaveInputs: [],
    allowanceInputs: [],
  };
  if (input.contractVersionOverride) {
    // Seed corrupt/unsupported row directly into registry storage for unavailable path.
    const versions = JSON.parse(
      localStorage.getItem(PUBLISHED_TIMESHEET_REGISTRY_KEYS.versions) ?? "[]"
    ) as unknown[];
    versions.push({
      ...content,
      contractVersion: input.contractVersionOverride,
      sourceVersion: input.sourceVersion ?? 1,
      approvalRevision: 1,
      approvalState: "approved",
      contentHash: "a".repeat(64),
      publishedAt: new Date().toISOString(),
      publisherId: "test",
      eventId: input.eventId,
      idempotencyKey: input.eventId,
      eventSequence: versions.length + 1,
      registryPublicationId: `pts_unsupported_${input.eventId}`,
    });
    localStorage.setItem(PUBLISHED_TIMESHEET_REGISTRY_KEYS.versions, JSON.stringify(versions));
    const current = JSON.parse(
      localStorage.getItem(PUBLISHED_TIMESHEET_REGISTRY_KEYS.current) ?? "{}"
    ) as Record<string, unknown>;
    const ck = `${input.organisationId}::${input.legalEntityId}::${input.timesheetRecordId}`;
    current[ck] = {
      organisationId: input.organisationId,
      legalEntityId: input.legalEntityId,
      timesheetRecordId: input.timesheetRecordId,
      currentSourceVersion: input.sourceVersion ?? 1,
      currentApprovalRevision: 1,
      currentApprovalState: "approved",
      currentContentHash: "a".repeat(64),
      currentRegistryPublicationId: `pts_unsupported_${input.eventId}`,
      latestEventSequence: versions.length,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(PUBLISHED_TIMESHEET_REGISTRY_KEYS.current, JSON.stringify(current));
    return;
  }
  publishTimesheetVersion({
    content,
    sourceVersion: input.sourceVersion ?? 1,
    approvalRevision: 1,
    approvalState: "approved",
    publishedAt: new Date().toISOString(),
    publisherId: "test-publisher",
    eventId: input.eventId,
    idempotencyKey: input.eventId,
  });
}

describe("CP2.3 M07 platform boundary — no legacy M06 scrape", () => {
  beforeEach(() => resetM07TestEnv());

  describe("A. Legacy removal / static enforcement", () => {
    it("M07 production source has no pulse.m06 access, M06 imports, or key enumeration scrape", () => {
      const files = walkProductionTsFiles(M07_ROOT);
      assert.ok(files.length > 10, "expected M07 production files");

      const prohibitedImportFragments = [
        "modules/m06-time-attendance/repository",
        "modules/m06-time-attendance/storage",
        "modules/m06-time-attendance/services",
        "modules/m06-time-attendance/types",
        "m06-time-attendance/repository",
        "m06-time-attendance/storage",
        "m06-time-attendance/services/",
      ];

      for (const file of files) {
        const rel = relative(process.cwd(), file).replace(/\\/g, "/");
        const raw = readFileSync(file, "utf8");
        const code = stripCommentsAndStrings(raw);

        // Literal M06 storage prefix must not appear outside comments/strings in production code.
        // (Strings stripped — so remaining pulse.m06 would be identifier abuse; also check raw for key const.)
        assert.doesNotMatch(
          code,
          /pulse\.m06/,
          `${rel} contains pulse.m06 outside comments/strings`
        );
        assert.doesNotMatch(
          raw,
          /["'`]pulse\.m06\.[^"'`]*["'`]/,
          `${rel} contains a pulse.m06.* string literal (prohibited scrape key)`
        );
        // Concatenation / join bypasses
        assert.doesNotMatch(
          code,
          /pulse["']\s*\+|["']pulse["']\s*\+|join\(\s*\[[^\]]*m06/i,
          `${rel} looks like pulse.m06 key construction`
        );
        assert.doesNotMatch(code, /attendance\.timesheets/, `${rel} references attendance.timesheets`);

        for (const frag of prohibitedImportFragments) {
          assert.ok(
            !raw.includes(frag),
            `${rel} imports or references prohibited path fragment ${frag}`
          );
        }

        // localStorage key enumeration used to discover M06
        if (/localStorage\.key\s*\(/.test(code) || /for\s*\(.*localStorage/.test(code)) {
          assert.doesNotMatch(
            raw,
            /m06/i,
            `${rel} enumerates localStorage in a way that mentions m06`
          );
        }
      }

      // Adapter must declare platform source, not legacy scrape constant value
      const adapter = readFileSync(join(M07_ROOT, "adapters/m06-timesheet-read.ts"), "utf8");
      assert.match(adapter, /platform\.PublishedTimesheetRegistry/);
      assert.doesNotMatch(adapter, /["']pulse\.m06\.attendance\.timesheets["']/);
      assert.equal(M07_PUBLISHED_TIMESHEET_DISCOVERY_SOURCE, "platform.PublishedTimesheetRegistry");
    });

    it("writing legacy M06 timesheet keys does not feed M07 discovery (no fallback scrape)", () => {
      writeJsonSafe("pulse.m06.attendance.timesheets", [
        {
          id: "legacy_ts",
          personId: "person_a",
          approved: true,
          state: "approved",
          organisationId: ORG_A,
          legalEntityId: LE_A,
        },
      ]);
      const result = discoverPublishedTimesheets({
        organisationId: ORG_A,
        legalEntityId: LE_A,
      });
      assert.equal(result.status, "empty");
      assert.equal(result.items.length, 0);
      assert.equal(result.blockedM07, false);
    });
  });

  describe("B. Controlled behaviour", () => {
    it("returns empty when no platform publication exists", () => {
      const result = discoverPublishedTimesheets({
        organisationId: ORG_A,
        legalEntityId: LE_A,
      });
      assert.equal(result.status, "empty");
      assert.equal(result.reason, "NO_ELIGIBLE_PUBLICATION");
      assert.equal(result.intakeStatus, "not-implemented");
      assert.equal(result.blockedM07, false);
      assert.equal(listApprovedTimesheetRefs({ organisationId: ORG_A, legalEntityId: LE_A }).length, 0);
    });

    it("returns unavailable for corrupt registry", () => {
      localStorage.setItem(PUBLISHED_TIMESHEET_REGISTRY_KEYS.versions, "{not-an-array");
      const result = discoverPublishedTimesheets({
        organisationId: ORG_A,
        legalEntityId: LE_A,
      });
      assert.equal(result.status, "unavailable");
      assert.equal(result.reason, "REGISTRY_CORRUPT");
      assert.equal(result.blockedM07, false);
    });

    it("returns unavailable for unsupported contract versions only", () => {
      publishFixture({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_old",
        eventId: "evt_old",
        contractVersionOverride: "published-timesheet.v0",
      });
      const result = discoverPublishedTimesheets({
        organisationId: ORG_A,
        legalEntityId: LE_A,
      });
      assert.equal(result.status, "unavailable");
      assert.equal(result.reason, "UNSUPPORTED_CONTRACT");
      assert.equal(result.blockedM07, false);
    });

    it("discovers platform publications without implying intake", () => {
      publishFixture({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_ok",
        eventId: "evt_ok",
      });
      const result = discoverPublishedTimesheets({
        organisationId: ORG_A,
        legalEntityId: LE_A,
      });
      assert.equal(result.status, "available");
      assert.equal(result.items.length, 1);
      assert.equal(result.items[0]!.intakeImplemented, false);
      assert.equal(result.items[0]!.organisationId, ORG_A);
      assert.equal(result.items[0]!.legalEntityId, LE_A);
      assert.notEqual(result.items[0]!.organisationId, result.items[0]!.legalEntityId);
      assert.equal(result.blockedM07, false);
      assert.equal(M07_INTAKE_BATCH1_STATUS, "not-implemented");

      const link = linkApprovedTimesheetToPeriod(
        "period_x",
        createTimesheetRef({
          recordId: "ts_ok",
          status: "approved",
          personId: "wp_a",
          periodStart: "2026-07-01",
          periodEnd: "2026-07-14",
          approved: true,
        })
      );
      assert.equal(link.ok, false);
      assert.equal(link.blockedM07, false);

      const blocker = getM07TimesheetIntakeBlockerStatus();
      assert.equal(blocker.blocked, false);
      assert.equal(blocker.workflowEvidenceCode, "CLEARED-M07-BATCH2");
    });
  });

  describe("C. Tenant isolation", () => {
    it("does not return cross-org or cross-legal-entity publications; guessed ids fail closed", () => {
      publishFixture({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_a",
        eventId: "evt_a",
      });
      publishFixture({
        organisationId: ORG_B,
        legalEntityId: LE_B,
        timesheetRecordId: "ts_b",
        eventId: "evt_b",
      });

      const a = discoverPublishedTimesheets({ organisationId: ORG_A, legalEntityId: LE_A });
      assert.equal(a.items.length, 1);
      assert.equal(a.items[0]!.timesheetRecordId, "ts_a");

      const wrongLe = discoverPublishedTimesheets({ organisationId: ORG_A, legalEntityId: LE_B });
      assert.equal(wrongLe.items.length, 0);

      const wrongOrg = discoverPublishedTimesheets({ organisationId: ORG_B, legalEntityId: LE_A });
      assert.equal(wrongOrg.items.length, 0);

      const pubId = a.items[0]!.registryPublicationId;
      assert.equal(
        getDiscoveredPublication({ organisationId: ORG_B, legalEntityId: LE_B }, pubId),
        null
      );
      assert.equal(
        getDiscoveredPublication({ organisationId: ORG_A, legalEntityId: LE_A }, pubId)?.timesheetRecordId,
        "ts_a"
      );
    });
  });

  describe("D. Preservation / blocker", () => {
    it("does not wipe M07 batch1 keys and keeps BLOCKED-M07 cleared", () => {
      writeJsonSafe("pulse.m07.staffpay.periods", [{ id: "keep_me" }]);
      discoverPublishedTimesheets({ organisationId: ORG_A, legalEntityId: LE_A });
      assert.equal(JSON.parse(localStorage.getItem("pulse.m07.staffpay.periods")!).length, 1);
      assert.equal(getM07TimesheetIntakeBlockerStatus().blocked, false);
    });
  });
});
