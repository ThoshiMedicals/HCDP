import { notFound, redirect } from "next/navigation";
import { MODULES, getModule, isModuleId } from "@/lib/modules";
import { APPROVED_MAIN_SLUGS, buildLegacyRedirectHref } from "@/platform/navigation/legacy-routes";
import { ModuleWorkspace } from "@/components/workspaces/ModuleWorkspace";

export function generateStaticParams() {
  const approved = MODULES.map((m) => ({ module: m.id }));
  // Keep legacy slugs in the static set so redirects resolve without 404 in static export edges
  const legacy = [
    "approvals",
    "organisation",
    "staff",
    "doctors",
    "hr-docs",
    "timeclock",
    "sync-centre",
    "tasks",
    "checklists",
    "frontdesk",
    "meetings",
    "compliance-centre",
    "accreditation",
    "qi",
    "audit",
    "expiry",
    "documents",
    "policies",
    "inventory",
    "stock",
    "equipment",
    "rooms",
    "incidents",
    "risk-centre",
    "emergency-centre",
    "email",
    "sms",
    "memos",
    "commbook",
    "noticeboards",
    "website",
    "remote",
    "vault",
    "cameras",
    "product-assurance",
  ].map((module) => ({ module }));
  const seen = new Set<string>();
  return [...approved, ...legacy].filter((p) => {
    if (seen.has(p.module)) return false;
    seen.add(p.module);
    return true;
  });
}

export default async function ModulePage({
  params,
  searchParams,
}: {
  params: Promise<{ module: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { module: moduleId } = await params;
  const sp = searchParams ? await searchParams : {};
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string") qs.set(k, v);
    else if (Array.isArray(v) && v[0]) qs.set(k, v[0]);
  }

  // Legacy aliases → approved module + section
  if (!APPROVED_MAIN_SLUGS.has(moduleId)) {
    const href = buildLegacyRedirectHref(moduleId, qs);
    if (href) redirect(href);
  }

  if (!isModuleId(moduleId)) notFound();
  const mod = getModule(moduleId);
  if (!mod) notFound();
  return <ModuleWorkspace module={mod} />;
}
