import { notFound, redirect } from "next/navigation";
import { MODULES, getModule, isModuleId } from "@/lib/modules";
import { ModuleWorkspace } from "@/components/workspaces/ModuleWorkspace";

export function generateStaticParams() {
  return MODULES.map((m) => ({ module: m.id }));
}

export default async function ModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module: moduleId } = await params;

  // Legacy Approvals destination → Action Inbox Approvals category
  if (moduleId === "approvals") {
    redirect("/action-inbox?category=Approval");
  }

  if (!isModuleId(moduleId)) notFound();
  const mod = getModule(moduleId);
  if (!mod) notFound();
  return <ModuleWorkspace module={mod} />;
}
