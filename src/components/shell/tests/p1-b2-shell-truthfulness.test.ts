/**
 * P1-B2 — Shell truthfulness / demo honesty contracts + runtime gates.
 * No product runtime acceptance hooks.
 */
import assert from "node:assert/strict";
import { describe, it, before, after } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  isQaDemoModeEnabled,
  setQaDemoModeEnabled,
  QA_DEMO_MODE_NOTICE,
} from "@/platform/context/qa-demo-mode";
import { isDemoIdentityMode } from "@/platform/auth/demo/demo-isolation";
import { syncFromModule1SelectedClinics } from "@/platform/context/clinic-context";
import { resolveIsDark, CC_STORAGE } from "@/lib/command-centre/storage";

const root = process.cwd();
function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

describe("P1-B2 unsupported Topbar controls (OWN-P1-004)", () => {
  const topbar = read("src/components/shell/Topbar.tsx");

  it("Export is focusable aria-disabled with described unavailable reason", () => {
    assert.match(topbar, /shell-export-unavailable/);
    assert.match(topbar, /aria-disabled="true"/);
    assert.match(topbar, /aria-describedby="shell-export-unavailable-desc"/);
    assert.match(topbar, /shell-export-unavailable-desc/);
    assert.match(topbar, /group-focus-within:opacity-100|exportExplainFocused|fixed bottom-\[18px\]/);
    assert.match(topbar, /Unavailable — portal export requires a reporting backend/);
    assert.doesNotMatch(topbar, /\sdisabled(=|\s|>)/);
    assert.doesNotMatch(topbar, /Export prepared|Export complete|pushToast\([^)]*Export/);
    assert.match(topbar, /e\.preventDefault\(\)/);
  });

  it("Enterprise MFA is focusable aria-disabled without success simulation", () => {
    assert.match(topbar, /shell-mfa-unavailable/);
    assert.match(topbar, /aria-describedby="shell-mfa-unavailable-desc"/);
    assert.match(topbar, /Unavailable — Enterprise MFA requires a live authentication backend/);
    assert.doesNotMatch(topbar, /MFA verified|MFA enabled|Enterprise Sign-In ready/);
  });

  it("New Entry remains a genuine create-drawer pathway", () => {
    assert.match(topbar, /shell-new-entry/);
    assert.match(topbar, /openCreate\("locations"\)/);
    assert.match(topbar, /local demo storage/i);
  });
});

describe("P1-B2 multi-clinic accepted difference (OWN-P1-005)", () => {
  const topbar = read("src/components/shell/Topbar.tsx");
  const harness = read("scripts/p1-b2-shell-truthfulness-harness.mjs");
  const clinic = read("src/platform/context/clinic-context.tsx");

  it("Topbar directs multi-clinic selection to Command Centre without success toast", () => {
    assert.match(topbar, /Shell multi-clinic selection is not available/);
    assert.match(topbar, /Command Centre/);
    assert.match(topbar, /pushToast\(MULTI_CLINIC_GUIDANCE,\s*"warn"\)/);
    assert.doesNotMatch(topbar, /shell-wide multi-select/);
  });

  it("Command Centre sync is the authorised multi-clinic product path", () => {
    assert.match(clinic, /export function syncFromModule1SelectedClinics/);
    assert.match(clinic, /setMultipleClinics/);
    const cc = read("src/components/workspaces/command-centre/CommandCentre.tsx");
    assert.match(cc, /syncFromModule1SelectedClinics\(selectedClinicIds\)/);
  });

  it("harness does not fabricate Topbar option DOM", () => {
    assert.doesNotMatch(harness, /createElement\(["']option["']\)/);
    assert.doesNotMatch(harness, /appendChild\(opt\)/);
    assert.doesNotMatch(harness, /Multiple Clinics["'].*createElement|inject temporary option/i);
  });

  it("does not claim OWN-P1-016 or SQL tenancy resolution", () => {
    assert.doesNotMatch(topbar, /OWN-P1-016|SQL-backed clinic|production tenancy/);
  });

  it("syncFromModule1SelectedClinics is exported for Command Centre multi-clinic path", () => {
    assert.equal(typeof syncFromModule1SelectedClinics, "function");
  });
});

describe("P1-B2 QA/demo gate (OWN-P1-008)", () => {
  const qa = read("src/platform/context/qa-demo-mode.tsx");
  const topbar = read("src/components/shell/Topbar.tsx");
  const sidebar = read("src/components/shell/Sidebar.tsx");
  const layout = read("src/app/(portal)/layout.tsx");
  const cc = read("src/components/workspaces/command-centre/CommandCentre.tsx");
  const org = read("src/components/workspaces/OrganisationWorkspace.tsx");
  const inbox = read("src/components/workspaces/action-inbox/ActionInboxApp.tsx");

  it("QaDemoModeProvider defaults off and documents demonstration facility", () => {
    assert.match(qa, /isDemoIdentityMode/);
    assert.match(qa, /enabled: false/);
    assert.match(qa, /QA_DEMO_MODE_NOTICE/);
    assert.match(qa, /not a production security boundary/i);
    assert.match(layout, /QaDemoModeProvider/);
    assert.equal(typeof QA_DEMO_MODE_NOTICE, "string");
  });

  it("production enforcement forces QA/demo mode off", () => {
    const prev = process.env.AUTH_ENFORCEMENT;
    process.env.AUTH_ENFORCEMENT = "production";
    try {
      assert.equal(isDemoIdentityMode(), false);
      setQaDemoModeEnabled(true);
      assert.equal(isQaDemoModeEnabled(), false);
    } finally {
      if (prev === undefined) delete process.env.AUTH_ENFORCEMENT;
      else process.env.AUTH_ENFORCEMENT = prev;
    }
  });

  it("Online simulation is gated behind QA/demo mode", () => {
    assert.match(topbar, /qaDemoMode \?/);
    assert.match(topbar, /shell-online-demo-toggle/);
    assert.match(topbar, /not live platform connectivity/i);
  });

  it("Sidebar exposes an explicit QA/demo toggle and labelled status", () => {
    assert.match(sidebar, /shell-qa-demo-mode-toggle/);
    assert.match(sidebar, /shell-qa-demo-mode-status/);
    assert.match(sidebar, /Enable QA \/ Demo tools/);
  });

  it("Command Centre QA Demo menu only mounts when qaDemoMode is active", () => {
    assert.match(cc, /onQaSimulateNextDay=\{\s*qaDemoMode/);
    assert.match(cc, /onQaResetActions=\{\s*qaDemoMode/);
  });

  it("Organisation and Action Inbox demo tools are gated", () => {
    assert.match(org, /qaDemoMode \?/);
    assert.match(org, /Reset demo data/);
    assert.match(org, /window\.confirm/);
    assert.match(inbox, /qaDemoMode/);
    assert.match(inbox, /Local demo role override/);
    assert.match(inbox, /window\.confirm/);
  });

  it("does not reintroduce P1-B1 harness hooks", () => {
    assert.doesNotMatch(layout, /ShellHarnessProbe|p1-b1-harness/);
    assert.doesNotMatch(inbox, /p1-b1-harness-force-inbox-error/);
    assert.equal(existsSync(join(root, "src/components/shell/ShellHarnessProbe.tsx")), false);
  });
});

describe("P1-B2 identity consistency (OWN-P1-017)", () => {
  const sidebar = read("src/components/shell/Sidebar.tsx");
  const cc = read("src/components/workspaces/command-centre/CommandCentre.tsx");
  const inbox = read("src/components/workspaces/action-inbox/ActionInboxApp.tsx");
  const overview = read("src/components/workspaces/organisation/OverviewSection.tsx");

  it("Sidebar and Command Centre greeting use platform identity displayName", () => {
    assert.match(sidebar, /shell-current-user-name/);
    assert.match(sidebar, /identity\.displayName/);
    assert.match(cc, /cc-current-user-greeting/);
    assert.match(cc, /actingUserName/);
    assert.match(cc, /\{greeting\}, \{actingUserName\}/);
    assert.match(cc, /currentUserName=\{actingUserName\}/);
    assert.doesNotMatch(cc, /\{greeting\}, Neil\./);
    const controlBar = read("src/components/workspaces/command-centre/ControlBar.tsx");
    assert.match(controlBar, /currentUserName/);
    assert.doesNotMatch(controlBar, /Neil ▾/);
  });

  it("Action Inbox signed-in label uses identity, not DEMO_USER", () => {
    assert.match(inbox, /const actor = identity\.displayName/);
    assert.match(inbox, /inbox-signed-in-as/);
    assert.doesNotMatch(inbox, /const actor = DEMO_USER\.name/);
  });

  it("Organisation overview no longer hardcodes Sarah as signed-in user", () => {
    assert.match(overview, /identity\.displayName/);
    assert.doesNotMatch(overview, /Acting as Sarah Mitchell \(Senior Administrator\)/);
  });
});

describe("P1-B2 appearance System contract", () => {
  it("resolveIsDark follows system preference for system appearance", () => {
    // Without window.matchMedia, resolveIsDark treats non-dark as false for non-browser —
    // assert source contract for system branch.
    const src = read("src/lib/command-centre/storage.ts");
    assert.match(src, /prefers-color-scheme: dark/);
    assert.match(src, /value === "system"/);
    assert.match(src, /CC_STORAGE\.appearance/);
    assert.equal(CC_STORAGE.appearance, "pulse.cc.appearance");
    void resolveIsDark;
  });
});

describe("P1-B2 honesty remnants (GAP-007/030/071/073)", () => {
  const dash = read("src/components/workspaces/DashboardShellControls.tsx");
  const reports = read("src/components/workspaces/organisation/ReportsSection.tsx");
  const topbar = read("src/components/shell/Topbar.tsx");

  it("Dashboard non-operational labels remain non-success controls", () => {
    assert.match(dash, /nonOperationalNote/);
    assert.match(dash, /Non-operational — live authentication backend required/);
    assert.match(dash, /Start intervention — non-operational/);
    assert.doesNotMatch(dash, /pushToast\([^)]*success/);
  });

  it("Reports/export honesty avoids live-backend claims", () => {
    assert.match(reports, /Not a live reporting or export-processing backend/);
  });

  it("Online toggle is labelled as browser demo simulation", () => {
    assert.match(topbar, /browser demo simulation/i);
    assert.match(topbar, /Online \(demo\)|Offline \(demo\)/);
  });
});
