/** M01 executive workforce counts from M04 SoT. */

import * as store from "../repository/local-store";
import { getEffectiveReadiness } from "../services/readiness-service";

export type WorkforceCounts = {
  activeStaff: number;
  activeDoctors: number;
  blockedReadiness: number;
  onLeave: number;
};

export function getWorkforceCounts(clinicId?: string): WorkforceCounts {
  const people = store.listPeople().filter((p) => {
    if (p.status !== "Active") return false;
    if (clinicId && !p.clinicIds.includes(clinicId)) return false;
    return true;
  });

  const today = new Date().toISOString().slice(0, 10);
  const approvedLeave = store.listLeave().filter((l) => {
    if (l.status !== "Approved") return false;
    return l.startDate <= today && l.endDate >= today;
  });
  const onLeavePersonIds = new Set(approvedLeave.map((l) => l.personId));

  let blockedReadiness = 0;
  for (const p of people) {
    const eff = getEffectiveReadiness(p.id);
    if (eff.readiness === "blocked" || eff.stale) blockedReadiness += 1;
  }

  return {
    activeStaff: people.filter((p) => p.personKind === "staff").length,
    activeDoctors: people.filter((p) => p.personKind === "doctor").length,
    blockedReadiness,
    onLeave: people.filter((p) => onLeavePersonIds.has(p.id)).length,
  };
}
