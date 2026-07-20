"use client";

import { useEffect, useState } from "react";
import type { ModuleDef } from "@/lib/modules";
import { usePortal } from "@/lib/portal-context";
import { PageHeader } from "@/components/shell/PageHeader";
import { HtmlPrototypeFrame } from "@/components/shell/HtmlPrototypeFrame";
import { Button } from "@/components/ui/Button";
import { ActionInboxWorkspace } from "./ActionInboxWorkspace";
import { DashboardWorkspace } from "./DashboardWorkspace";
import { ModuleStub } from "./ModuleStub";
import { OrganisationWorkspace } from "./OrganisationWorkspace";
import { TasksWorkspace } from "./TasksWorkspace";
import {
  AccreditationWorkspace,
  ChecklistsWorkspace,
  DoctorsDirectoryWorkspace,
  HtmlModuleFallback,
  RiskCentreWorkspace,
  StaffDirectoryWorkspace,
} from "./HtmlSeedWorkspaces";

type ViewMode = "html" | "next";

export function ModuleWorkspace({ module }: { module: ModuleDef }) {
  const { rememberModule } = usePortal();
  const isCommandCentre = module.htmlId === "dashboard";
  const isOrganisation = module.htmlId === "settings";
  const isActionInbox = module.htmlId === "actionInbox";
  const forceNextRebuild = isCommandCentre || isOrganisation || isActionInbox;
  const [otherViewMode, setOtherViewMode] = useState<ViewMode>("html");
  const viewMode: ViewMode = forceNextRebuild ? "next" : otherViewMode;

  useEffect(() => {
    rememberModule(module.id);
  }, [module.id, rememberModule]);

  let body: React.ReactNode;
  switch (module.htmlId) {
    case "dashboard":
      body = <DashboardWorkspace />;
      break;
    case "actionInbox":
      body = <ActionInboxWorkspace />;
      break;
    case "settings":
      body = <OrganisationWorkspace />;
      break;
    case "tasks":
      body = <TasksWorkspace />;
      break;
    case "staff":
      body = <StaffDirectoryWorkspace />;
      break;
    case "doctors":
      body = <DoctorsDirectoryWorkspace />;
      break;
    case "checklists":
    case "frontdesk":
      body = <ChecklistsWorkspace />;
      break;
    case "accreditation":
      body = <AccreditationWorkspace />;
      break;
    case "riskCentre":
    case "complianceCentre":
      body = <RiskCentreWorkspace />;
      break;
    default:
      body = module.polished ? (
        <ModuleStub module={module} />
      ) : (
        <HtmlModuleFallback
          title={module.title}
          source={`HTML module id: ${module.htmlId}`}
          icon={module.icon}
          htmlId={module.htmlId}
        />
      );
  }

  return (
    <>
      {!isCommandCentre || viewMode === "html" ? <PageHeader module={module} /> : null}
      {!isCommandCentre && !isOrganisation && !isActionInbox ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--v34-card-line)] bg-[#f8fafc] px-4 py-2 lg:px-7">
          <span className="text-xs font-bold text-[#526479]">View source:</span>
          <Button
            small
            variant={viewMode === "html" ? "teal" : "line"}
            onClick={() => setOtherViewMode("html")}
          >
            Exact HTML (complete)
          </Button>
          <Button
            small
            variant={viewMode === "next" ? "teal" : "line"}
            onClick={() => setOtherViewMode("next")}
          >
            Next rebuild
          </Button>
          <span className="text-xs text-[#738196]">
            HTML mode is a byte-for-byte copy of the prototype — every form, seed and wizard.
          </span>
        </div>
      ) : null}
      {viewMode === "html" ? (
        <HtmlPrototypeFrame htmlId={module.htmlId} />
      ) : (
        <section
          className={
            isCommandCentre
              ? "content w-full max-w-none px-0 py-0 pb-0"
              : isActionInbox
                ? "content mx-auto w-full max-w-[1600px] px-4 py-5 pb-20 lg:px-7 lg:py-[26px]"
                : "content mx-auto w-full max-w-[1480px] px-4 py-5 pb-20 lg:px-7 lg:py-[26px]"
          }
        >
          {body}
        </section>
      )}
    </>
  );
}
