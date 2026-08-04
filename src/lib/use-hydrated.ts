"use client";

import { useSyncExternalStore } from "react";

/**
 * True only after hydration. During SSR and the client's hydration render,
 * React uses getServerSnapshot (false) so markup stays identical.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );
}
