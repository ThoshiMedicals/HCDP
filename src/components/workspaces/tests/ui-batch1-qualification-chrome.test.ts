/**
 * UI Batch 1 Qualification Completion (QC-1) — dashboard chrome truthfulness
 * and appearance preference application (OD-A1 NARROW / F-MAJ-01 / F-MIN-04).
 *
 * Owner visual remediation relocated DashboardShellStrip into
 * DashboardShellControlsPanel (secondary disclosure). Truthfulness assertions
 * follow that surface; stacked ModuleContextStrip chrome is intentionally removed.
 */

import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  applyAppearance,
  CC_STORAGE,
  readAppearance,
  resolveIsDark,
  setAppearanceStore,
  writeAppearance,
} from "@/lib/command-centre/storage";

const root = process.cwd();

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("QC-1 — Dashboard shell controls chrome truthfulness (F-MAJ-01 / UI-DASH-03 / UI-FAKE-01)", () => {
  it("removes toast-only demo verbs from relocated DashboardShellControlsPanel", () => {
    const strip = read("src/components/workspaces/DashboardShellControls.tsx");

    assert.doesNotMatch(strip, /pushToast\(/);
    assert.doesNotMatch(strip, /demo only/i);
    assert.doesNotMatch(strip, /Simulate outage/i);
    assert.doesNotMatch(strip, /Review sign-in journey/i);
    assert.doesNotMatch(strip, /Start Intervention/);
    assert.doesNotMatch(strip, /onAction/);
    assert.doesNotMatch(strip, /variant="danger"/);
  });

  it("retains navigation-only shell controls and labels non-operational status", () => {
    const strip = read("src/components/workspaces/DashboardShellControls.tsx");

    assert.match(strip, /href="\/organisation"/);
    assert.match(strip, /Review access controls/);
    assert.match(strip, /href="\/sync-centre"/);
    assert.match(strip, /Open staging review/);
    assert.match(strip, /href="\/emergency-centre"/);
    assert.match(strip, /Open Emergency Control/);
    assert.match(strip, /Non-operational/);
    assert.match(strip, /role="status"/);
  });

  it("does not stack ModuleContextStrip / DashboardShellStrip above Command Centre", () => {
    const dash = read("src/components/workspaces/DashboardWorkspace.tsx");
    assert.doesNotMatch(dash, /ModuleContextStrip/);
    assert.doesNotMatch(dash, /DashboardShellStrip/);
    assert.match(dash, /CommandCentre/);
    assert.match(dash, /data-dashboard-hierarchy="executive-v2"/);
  });

  it("does not widen QC-1 into CommandCentre toast inventory (OD-A1 NARROW)", () => {
    const cc = read("src/components/workspaces/command-centre/CommandCentre.tsx");
    assert.match(cc, /pushToast\(/);
    assert.ok(cc.includes("CommandCentre"), "Command Centre file remains present and unmodified by this assertion");
  });
});

describe("QC-1 — in-app appearance preference application (F-MIN-04 / UI-APPEAR-01)", () => {
  const originalMatchMedia = globalThis.matchMedia;
  const originalLocalStorage = globalThis.localStorage;

  afterEach(() => {
    if (typeof document !== "undefined" && document.body?.classList) {
      document.body.classList.remove("theme-dark");
    }
    if (originalMatchMedia) {
      globalThis.matchMedia = originalMatchMedia;
    } else {
      Reflect.deleteProperty(globalThis, "matchMedia");
    }
    if (originalLocalStorage) {
      Object.defineProperty(globalThis, "localStorage", {
        value: originalLocalStorage,
        configurable: true,
      });
    }
  });

  function installDomStorage(seed: Record<string, string> = {}) {
    const store = new Map<string, string>(Object.entries(seed));
    const localStorageMock = {
      getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
      setItem: (key: string, value: string) => {
        store.set(key, String(value));
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => store.clear(),
    };
    Object.defineProperty(globalThis, "localStorage", {
      value: localStorageMock,
      configurable: true,
    });
    Object.defineProperty(globalThis, "window", {
      value: globalThis,
      configurable: true,
    });
    if (typeof document === "undefined") {
      const classes = new Set<string>();
      const classList = {
        toggle: (token: string, force?: boolean) => {
          const on = force === undefined ? !classes.has(token) : !!force;
          if (on) classes.add(token);
          else classes.delete(token);
          return on;
        },
        contains: (token: string) => classes.has(token),
        remove: (...tokens: string[]) => tokens.forEach((t) => classes.delete(t)),
        add: (...tokens: string[]) => tokens.forEach((t) => classes.add(t)),
      };
      Object.defineProperty(globalThis, "document", {
        value: { body: { classList } },
        configurable: true,
      });
    }
    return store;
  }

  function stubMatchMedia(prefersDark: boolean) {
    globalThis.matchMedia = ((query: string) =>
      ({
        matches: query.includes("dark") ? prefersDark : !prefersDark,
        media: query,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
        onchange: null,
      })) as typeof matchMedia;
  }

  it("applies Light / Dark / System via existing appearance store helpers", () => {
    const store = installDomStorage();
    stubMatchMedia(false);

    setAppearanceStore("light");
    assert.equal(readAppearance(), "light");
    assert.equal(document.body.classList.contains("theme-dark"), false);
    assert.equal(JSON.parse(store.get(CC_STORAGE.appearance) ?? "null"), "light");

    setAppearanceStore("dark");
    assert.equal(readAppearance(), "dark");
    assert.equal(document.body.classList.contains("theme-dark"), true);
    assert.equal(JSON.parse(store.get(CC_STORAGE.appearance) ?? "null"), "dark");

    setAppearanceStore("system");
    assert.equal(readAppearance(), "system");
    assert.equal(resolveIsDark("system"), false);
    assert.equal(document.body.classList.contains("theme-dark"), false);

    stubMatchMedia(true);
    applyAppearance("system");
    assert.equal(resolveIsDark("system"), true);
    assert.equal(document.body.classList.contains("theme-dark"), true);
  });

  it("persists appearance preference without requiring a second theme system", () => {
    const store = installDomStorage();
    stubMatchMedia(false);
    writeAppearance("dark");
    assert.equal(JSON.parse(store.get(CC_STORAGE.appearance) ?? "null"), "dark");
    assert.equal(readAppearance(), "dark");

    const tokens = read("src/styles/tokens.css");
    assert.match(tokens, /body\.theme-dark/);
    assert.match(tokens, /--hcdp-canvas:\s*#f5f7fa/i);
    assert.match(tokens, /--pce-canvas:\s*var\(--hcdp-canvas\)/i);

    const controlBar = read("src/components/workspaces/command-centre/ControlBar.tsx");
    assert.match(controlBar, /aria-label="Appearance"/);
    assert.match(controlBar, /<option value="light">Light<\/option>/);
    assert.match(controlBar, /<option value="dark">Dark<\/option>/);
    assert.match(controlBar, /<option value="system">Device setting<\/option>/);
  });

  it("keeps clinic/identity useSyncExternalStore server snapshots referentially stable", () => {
    const clinic = read("src/platform/context/clinic-context.tsx");
    const identity = read("src/platform/context/identity-context.tsx");
    assert.match(clinic, /CLINIC_SERVER_SNAPSHOT/);
    assert.match(clinic, /function getServerSnapshot\(\) \{\s*return CLINIC_SERVER_SNAPSHOT;/);
    assert.doesNotMatch(
      clinic,
      /function getServerSnapshot\(\) \{\s*return defaultState\(\);/
    );
    assert.match(identity, /IDENTITY_SERVER_SNAPSHOT/);
    assert.match(identity, /function getServerSnapshot\(\): DemoIdentity \{\s*return IDENTITY_SERVER_SNAPSHOT;/);
  });
});
