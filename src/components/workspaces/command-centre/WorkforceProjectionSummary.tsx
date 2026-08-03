"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  getWorkforceCounts,
  type WorkforceCounts,
} from "@/modules/m04-staff-doctors/adapters/m04-executive";
import { runM04StorageMigrations, migrateFromPortalOnce } from "@/modules/m04-staff-doctors/storage";
import { CcCard, CcCardHeader } from "./cc-ui";

/**
 * Module 4 workforce count projection for Module 1.
 * Read-only — Command Centre must not edit M04 records.
 */
export function WorkforceProjectionSummary() {
  const [counts, setCounts] = useState<WorkforceCounts | null>(null);

  useEffect(() => {
    const refresh = () => {
      runM04StorageMigrations();
      migrateFromPortalOnce();
      setCounts(getWorkforceCounts());
    };
    refresh();
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);

  if (!counts) return null;

  return (
    <CcCard accent="#7c3aed">
      <CcCardHeader
        title="Workforce (Module 4)"
        subtitle="Live counts from Staff & Doctor Management — not duplicated as editable Command Centre records"
      />
      <div className="space-y-3 px-4 pb-4">
        <div className="flex flex-wrap gap-2">
          <Badge tone="success">{counts.activeStaff} active staff</Badge>
          <Badge tone="info">{counts.activeDoctors} active doctors</Badge>
          <Badge tone="warn">{counts.blockedReadiness} blocked readiness</Badge>
          <Badge tone="default">{counts.onLeave} on leave</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/staff-doctors">
            <Button small variant="teal">
              Open Staff & Doctors
            </Button>
          </Link>
          <Link href="/staff-doctors?section=credentials">
            <Button small variant="line">
              Credentials
            </Button>
          </Link>
          <span className="self-center text-[length:var(--type-control)] text-[var(--cc-muted)]">
            Authoritative people and readiness remain in Module 4.
          </span>
        </div>
      </div>
    </CcCard>
  );
}
