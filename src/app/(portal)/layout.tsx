"use client";

import { PortalProvider, usePortal } from "@/lib/portal-context";
import { ClinicContextProvider } from "@/platform/context/clinic-context";
import { IdentityProvider } from "@/platform/context/identity-context";
import { QaDemoModeProvider } from "@/platform/context/qa-demo-mode";
import { CreateFormProvider } from "@/components/forms/CreateFormProvider";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import { ToastStack } from "@/components/ui/Toast";

function PortalChrome({ children }: { children: React.ReactNode }) {
  const { toasts } = usePortal();
  return (
    <CreateFormProvider>
      <div
        className="app flex min-h-screen max-w-[100vw] overflow-x-hidden bg-[var(--dp-bg-canvas,var(--v34-canvas))]"
        data-shell-foundation="p1-b1"
      >
        <Sidebar />
        <main
          className="main flex min-h-screen w-full min-w-0 max-w-full flex-col md:ml-[var(--sidebar-current,var(--sidebar))] md:w-[calc(100%-var(--sidebar-current,var(--sidebar)))]"
          data-shell-region="main-pane"
        >
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
      <ClinicContextProvider>
        <IdentityProvider>
          <QaDemoModeProvider>
            <PortalChrome>{children}</PortalChrome>
          </QaDemoModeProvider>
        </IdentityProvider>
      </ClinicContextProvider>
    </PortalProvider>
  );
}
