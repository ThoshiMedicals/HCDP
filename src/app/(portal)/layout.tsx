"use client";

import { PortalProvider, usePortal } from "@/lib/portal-context";
import { CreateFormProvider } from "@/components/forms/CreateFormProvider";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import { ToastStack } from "@/components/ui/Toast";

function PortalChrome({ children }: { children: React.ReactNode }) {
  const { toasts } = usePortal();
  return (
    <CreateFormProvider>
      <div className="app flex min-h-screen max-w-[100vw] overflow-x-hidden bg-[var(--v34-canvas)]">
        <Sidebar />
        <main className="main flex min-h-screen w-full min-w-0 max-w-full flex-col lg:ml-[var(--sidebar-current,var(--sidebar))] lg:w-[calc(100%-var(--sidebar-current,var(--sidebar)))]">
          <Topbar />
          <div className="min-w-0 w-full max-w-full overflow-x-hidden">{children}</div>
        </main>
        <ToastStack toasts={toasts} />
      </div>
    </CreateFormProvider>
  );
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalProvider>
      <PortalChrome>{children}</PortalChrome>
    </PortalProvider>
  );
}
