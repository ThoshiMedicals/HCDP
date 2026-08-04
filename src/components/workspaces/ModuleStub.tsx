import type { ModuleDef } from "@/lib/modules";
import { EmptyState } from "@/components/ui/EmptyState";
import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";

export function ModuleStub({ module }: { module: ModuleDef }) {
  return (
    <div className="grid gap-[18px]">
      <Panel>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge tone="teal">{module.group}</Badge>
          <Badge>UI stub</Badge>
        </div>
        <PanelTitle>{module.title}</PanelTitle>
        <PanelSub>{module.subtitle}</PanelSub>
        <div className="mt-4 rounded-2xl border border-[var(--hcdp-status-info-border)] bg-[var(--hcdp-status-info-surface)] px-3.5 py-3 text-sm text-[var(--hcdp-status-info-text)]">
          Coming in the next phase — this route matches the HTML navigation. No
          payroll, connector, or sensitive business logic is wired yet.
        </div>
        <EmptyState
          title="Workspace scaffold ready"
          description="Shell, routing and design tokens are in place. Enrich this module after the UI shell is signed off."
        />
      </Panel>
    </div>
  );
}
