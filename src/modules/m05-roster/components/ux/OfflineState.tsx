"use client";

import { useSyncExternalStore } from "react";
import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";

function subscribeOnline(onStoreChange: () => void): () => void {
  window.addEventListener("online", onStoreChange);
  window.addEventListener("offline", onStoreChange);
  return () => {
    window.removeEventListener("online", onStoreChange);
    window.removeEventListener("offline", onStoreChange);
  };
}

function getOfflineSnapshot(): boolean {
  return typeof navigator !== "undefined" ? !navigator.onLine : false;
}

/** SSR + hydration always online; live offline status applies after hydrate. */
function getOfflineServerSnapshot(): boolean {
  return false;
}

export function OfflineState() {
  const offline = useSyncExternalStore(
    subscribeOnline,
    getOfflineSnapshot,
    getOfflineServerSnapshot
  );

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
