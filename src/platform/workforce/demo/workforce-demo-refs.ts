/**
 * Demo workforce references for Wave 1 contract consumers.
 * Not full module seed data — refs only. M04 remains person SoT after promotion.
 */

import { createWorkforcePersonRef } from "../contracts/workforce-person-ref";
import { createEngagementRef } from "../contracts/engagement-ref";
import { createCredentialRef } from "../contracts/credential-ref";
import { createTrainingStatusRef } from "../contracts/training-status-ref";
import { createShiftRef } from "../contracts/shift-ref";
import { createAttendanceRef } from "../contracts/attendance-ref";
import { createTimesheetRef } from "../contracts/timesheet-ref";
import { createPayPeriodRef } from "../contracts/pay-period-ref";
import { createCandidateRef } from "../contracts/candidate-ref";
import { projectReadiness } from "../services/readiness-projection";

export const DEMO_PERSON = createWorkforcePersonRef({
  recordId: "person_demo_001",
  preferredName: "Sam Ortega",
  personKind: "staff",
  status: "active",
  clinicId: "chapel-hill",
  organisationId: "org-demo",
  engagementId: "eng_demo_001",
  section: "staff",
});

export const DEMO_ENGAGEMENT = createEngagementRef({
  recordId: "eng_demo_001",
  personId: DEMO_PERSON.recordId,
  roleLabel: "Clinical Nurse",
  employmentType: "Permanent",
  effectiveFrom: "2025-01-01",
  effectiveTo: null,
  status: "active",
  clinicId: "chapel-hill",
  organisationId: "org-demo",
});

export const DEMO_CREDENTIAL = createCredentialRef({
  recordId: "cred_demo_wwcc_001",
  personId: DEMO_PERSON.recordId,
  credentialType: "WWCC",
  status: "expired",
  expiresOn: "2026-07-12",
  verified: false,
  clinicId: "chapel-hill",
  organisationId: "org-demo",
});

export const DEMO_TRAINING = createTrainingStatusRef({
  recordId: "trn_demo_cpr_001",
  personId: DEMO_PERSON.recordId,
  requirementId: "req_cpr",
  requirementLabel: "CPR",
  status: "current",
  completedOn: "2026-01-15",
  expiresOn: "2027-01-15",
  competencyMet: true,
  clinicId: "chapel-hill",
  organisationId: "org-demo",
});

export const DEMO_READINESS = projectReadiness({
  personId: DEMO_PERSON.recordId,
  clinicId: "chapel-hill",
  organisationId: "org-demo",
  credentials: [DEMO_CREDENTIAL],
  training: [DEMO_TRAINING],
  asOf: "2026-07-27T00:00:00.000Z",
});

export const DEMO_SHIFT = createShiftRef({
  recordId: "shift_demo_001",
  rosterPeriodId: "period_w30",
  personId: DEMO_PERSON.recordId,
  startsAt: "2026-07-27T08:00:00.000Z",
  endsAt: "2026-07-27T16:00:00.000Z",
  roleLabel: "Clinical Nurse",
  published: false,
  status: "draft",
  clinicId: "chapel-hill",
  organisationId: "org-demo",
});

export const DEMO_ATTENDANCE = createAttendanceRef({
  recordId: "att_demo_001",
  personId: DEMO_PERSON.recordId,
  shiftId: DEMO_SHIFT.recordId,
  eventType: "clock-in",
  occurredAt: "2026-07-27T08:02:00.000Z",
  status: "recorded",
  clinicId: "chapel-hill",
  organisationId: "org-demo",
});

export const DEMO_TIMESHEET = createTimesheetRef({
  recordId: "ts_demo_001",
  personId: DEMO_PERSON.recordId,
  periodStart: "2026-07-20",
  periodEnd: "2026-07-26",
  approved: true,
  status: "approved",
  clinicId: "chapel-hill",
  organisationId: "org-demo",
});

export const DEMO_PAY_PERIOD = createPayPeriodRef({
  recordId: "pay_demo_2026_07",
  periodStart: "2026-07-01",
  periodEnd: "2026-07-31",
  exportCreated: false,
  locked: false,
  status: "open",
  clinicId: "chapel-hill",
  organisationId: "org-demo",
});

export const DEMO_CANDIDATE = createCandidateRef({
  recordId: "cand_demo_001",
  preferredName: "Jordan Lee",
  stage: "offer-accepted",
  vacancyId: "vac_demo_001",
  status: "pre-employment",
  clinicId: "chapel-hill",
  organisationId: "org-demo",
  promotedPersonId: null,
});

export const WORKFORCE_DEMO_REFS = {
  person: DEMO_PERSON,
  engagement: DEMO_ENGAGEMENT,
  credential: DEMO_CREDENTIAL,
  training: DEMO_TRAINING,
  readiness: DEMO_READINESS,
  shift: DEMO_SHIFT,
  attendance: DEMO_ATTENDANCE,
  timesheet: DEMO_TIMESHEET,
  payPeriod: DEMO_PAY_PERIOD,
  candidate: DEMO_CANDIDATE,
} as const;
