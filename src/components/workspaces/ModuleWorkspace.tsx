"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { ModuleDef } from "@/lib/modules";
import { usePortal } from "@/lib/portal-context";
import { PageHeader } from "@/components/shell/PageHeader";
import { CommandCentreModule } from "@/modules/m01-command-centre";
import { ActionInboxModule } from "@/modules/m02-action-inbox";
import { OrganisationAccessModule } from "@/modules/m03-organisation-access";
import { StaffDoctorsModule } from "@/modules/m04-staff-doctors";
import { RosterModule } from "@/modules/m05-roster";
import { TimeAttendanceModule } from "@/modules/m06-time-attendance";
import { StaffPayModule } from "@/modules/m07-staff-pay";
import { DoctorPayModule } from "@/modules/m08-doctor-pay";
import { BbpipModule } from "@/modules/m09-bbpip";
import { TasksActionsModule } from "@/modules/m10-tasks-actions";
import { TrainingModule } from "@/modules/m11-training";
import { ComplianceQualityModule } from "@/modules/m12-compliance-quality";
import { DocumentsModule } from "@/modules/m13-documents";
import { TicketingModule } from "@/modules/m14-ticketing";
import { InventoryAssetsModule } from "@/modules/m15-inventory-assets";
import { IncidentsRiskModule } from "@/modules/m16-incidents-risk";
import { CommunicationsModule } from "@/modules/m17-communications";
import { DigitalOperationsModule } from "@/modules/m18-digital-operations";
import { AnalyticsChangeModule } from "@/modules/m19-analytics-change";
import { CommercialWorkspacesModule } from "@/modules/m20-commercial-workspaces";
import { VendorOperationsModule } from "@/modules/m21-vendor-operations";
import { RecruitmentModule } from "@/modules/m22-recruitment";
import { WebsiteSeoModule } from "@/modules/m23-website-seo";
import { FinancialForecastModule } from "@/modules/m24-financial-forecast";
import { TasksWorkspace } from "./TasksWorkspace";
import {
  AccreditationWorkspace,
  ChecklistsWorkspace,
  RiskCentreWorkspace,
} from "./HtmlSeedWorkspaces";
import { ModuleLanding } from "./ModuleLanding";

/** Temporary partial Next panels for modules still mid-migration. */
function PartialBody({ module }: { module: ModuleDef }) {
  const search = useSearchParams();
  const section = search.get("section") ?? "";

  switch (module.platformId) {
    case "tasks-actions": {
      if (section === "meetings" || section === "meeting-actions") {
        return <TasksWorkspace initialTab="meetings" />;
      }
      if (section === "checklists" || section === "opening-closing") {
        return <ChecklistsWorkspace />;
      }
      return <TasksWorkspace />;
    }
    case "compliance-quality": {
      if (section === "accreditation") return <AccreditationWorkspace />;
      return <RiskCentreWorkspace />;
    }
    case "incidents-risk":
      return <RiskCentreWorkspace />;
    default:
      return null;
  }
}

function resolveModuleEntry(platformId: string): React.ReactNode {
  switch (platformId) {
    case "executive-command-centre":
      return <CommandCentreModule />;
    case "action-inbox":
      return <ActionInboxModule />;
    case "organisation-access":
      return <OrganisationAccessModule />;
    case "staff-doctors":
      return <StaffDoctorsModule />;
    case "roster":
      return <RosterModule />;
    case "time-attendance":
      return <TimeAttendanceModule />;
    case "staff-pay":
      return <StaffPayModule />;
    case "doctor-pay":
      return <DoctorPayModule />;
    case "bbpip":
      return <BbpipModule />;
    case "tasks-actions":
      return <TasksActionsModule />;
    case "training":
      return <TrainingModule />;
    case "compliance-quality":
      return <ComplianceQualityModule />;
    case "documents-policies":
      return <DocumentsModule />;
    case "ticketing":
      return <TicketingModule />;
    case "inventory-assets":
      return <InventoryAssetsModule />;
    case "incidents-risk":
      return <IncidentsRiskModule />;
    case "communications":
      return <CommunicationsModule />;
    case "digital-ops":
      return <DigitalOperationsModule />;
    case "analytics":
      return <AnalyticsChangeModule />;
    case "saas":
      return <CommercialWorkspacesModule />;
    case "vendor-console":
      return <VendorOperationsModule />;
    case "recruitment":
      return <RecruitmentModule />;
    case "website-studio":
      return <WebsiteSeoModule />;
    case "financial-forecast":
      return <FinancialForecastModule />;
    default:
      return null;
  }
}

function ModuleBody({ module }: { module: ModuleDef }) {
  const entry = resolveModuleEntry(module.platformId);
  const hasPartial =
    module.platformId === "tasks-actions" ||
    module.platformId === "compliance-quality" ||
    module.platformId === "incidents-risk";

  // Modules 1–4 are complete workspaces via module entry adapters
  if (
    module.platformId === "executive-command-centre" ||
    module.platformId === "action-inbox" ||
    module.platformId === "organisation-access" ||
    module.platformId === "staff-doctors"
  ) {
    return <>{entry}</>;
  }

  // Rebuild-pending modules: module entry renders ModuleLanding; attach partial panels when useful
  if (hasPartial) {
    return (
      <ModuleLanding module={module}>
        <Suspense fallback={null}>
          <PartialBody module={module} />
        </Suspense>
      </ModuleLanding>
    );
  }

  return <>{entry}</>;
}

/**
 * Thin workspace router — business logic lives in src/modules/* and src/platform/*.
 */
export function ModuleWorkspace({ module }: { module: ModuleDef }) {
  const { rememberModule } = usePortal();
  const isCommandCentre = module.platformId === "executive-command-centre";
  const isActionInbox = module.platformId === "action-inbox";

  useEffect(() => {
    rememberModule(module.platformId || module.id);
  }, [module.id, module.platformId, rememberModule]);

  return (
    <>
      {!isCommandCentre ? <PageHeader module={module} /> : null}
      <section
        className={
          isCommandCentre
            ? "content w-full max-w-none px-0 py-0 pb-0"
            : isActionInbox
              ? "content mx-auto w-full max-w-[1600px] px-4 py-5 pb-20 lg:px-7 lg:py-[26px]"
              : "content mx-auto w-full max-w-[1480px] px-4 py-5 pb-20 lg:px-7 lg:py-[26px]"
        }
      >
        <Suspense fallback={null}>
          <ModuleBody module={module} />
        </Suspense>
      </section>
    </>
  );
}
