"use client";

import { useEffect, useState } from "react";
import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";

export function OfflineState() {
  const [offline, setOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false
  );

  useEffect(() => {
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div data-ux-state="offline" data-testid="m05-ux-offline">
      <Panel>
        <PanelTitle>You are offline</PanelTitle>
        <PanelSub>
          Changes cannot be saved until your connection is restored. Read-only data
          may still be available from local storage.
        </PanelSub>
      </Panel>
    </div>
  );
}
