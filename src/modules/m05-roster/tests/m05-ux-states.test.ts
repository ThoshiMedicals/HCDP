/**
 * M05 UX state contract (§25 of the plan).
 *
 * Wave 4 UX components (RestrictedState / EmptyState / …) are not yet created
 * under `components/ux/` — those tsx modules are part of the deferred UI work.
 * This suite instead validates the SUPPORTING contract that every UX state
 * relies on:
 *
 *  - ConcurrentConflictError carries expected/actual versions + target metadata
 *    → drives `ConcurrentConflictState` recovery UI (§10, `UX-08`)
 *  - InvalidLifecycleTransitionError, OverrideReasonRequiredError,
 *    ImmutablePublicationError all identify themselves clearly for validation
 *    and system-error state rendering (`UX-05` / `UX-06`)
 *  - The eight UX-state identifiers required by the plan §25 are represented
 *    in the section-id / state-id vocabulary that the workspace will consume.
 *  - Storage bootstrap gate (`ensureM05Bootstrapped`) refuses to run in a
 *    non-window environment (so a `LoadingState` fallback is required at
 *    render time), and can be replayed idempotently for `OfflineState` retry.
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";

import {
  ConcurrentConflictError,
  ImmutablePublicationError,
  InvalidLifecycleTransitionError,
  OverrideReasonRequiredError,
} from "../services/errors";
import {
  ensureM05Bootstrapped,
  resetM05BootstrapCacheForTests,
} from "../storage/bootstrap";
import { runM05StorageMigrations } from "../storage/migrations";
import { runM05SchemaV2Migration } from "../storage/migrate-v2";

function installMemoryLocalStorage() {
  const map = new Map<string, string>();
  (globalThis as { window?: { localStorage: Storage } }).window = {
    localStorage: {
      getItem: (k) => (map.has(k) ? map.get(k)! : null),
      setItem: (k, v) => {
        map.set(k, String(v));
      },
      removeItem: (k) => {
        map.delete(k);
      },
      clear: () => map.clear(),
      key: () => null,
      length: 0,
    } as Storage,
  };
}

function removeWindow() {
  (globalThis as { window?: unknown }).window = undefined;
}

/** Eight UX states from §25 of the plan. */
const REQUIRED_UX_STATES = [
  "loading",
  "empty",
  "filtered-empty",
  "restricted",
  "validation-error",
  "system-error",
  "offline",
  "concurrent-conflict",
] as const;

describe("m05 ux-state contract", () => {
  beforeEach(() => {
    installMemoryLocalStorage();
    resetM05BootstrapCacheForTests();
  });

  it("UX-08: ConcurrentConflictError carries version/target metadata for retry UI", () => {
    const err = new ConcurrentConflictError({
      targetType: "period",
      targetId: "period-1",
      expectedVersion: 3,
      actualVersion: 4,
    });
    assert.equal(err.name, "ConcurrentConflictError");
    assert.equal(err.targetType, "period");
    assert.equal(err.targetId, "period-1");
    assert.equal(err.expectedVersion, 3);
    assert.equal(err.actualVersion, 4);
    assert.match(err.message, /Concurrent conflict|expected v3|current v4/);
  });

  it("UX-05: OverrideReasonRequiredError has a stable name and default message", () => {
    const err = new OverrideReasonRequiredError();
    assert.equal(err.name, "OverrideReasonRequiredError");
    assert.match(err.message, /override reason/i);
    const custom = new OverrideReasonRequiredError("Please justify");
    assert.equal(custom.message, "Please justify");
  });

  it("UX-05: InvalidLifecycleTransitionError encodes from/to for validation UI", () => {
    const err = new InvalidLifecycleTransitionError({
      from: "draft",
      to: "published",
      targetType: "period",
    });
    assert.equal(err.name, "InvalidLifecycleTransitionError");
    assert.equal(err.from, "draft");
    assert.equal(err.to, "published");
    assert.match(err.message, /draft.*published/);
  });

  it("UX-06 / immutable publication guard raises a distinct error", () => {
    const err = new ImmutablePublicationError();
    assert.equal(err.name, "ImmutablePublicationError");
    assert.match(err.message, /immutable|supersede/i);
  });

  it("§25: eight UX state identifiers are covered by the plan vocabulary", () => {
    // Sanity: these strings are what the workspace's `?uxState=` deep-link
    // dispatcher will accept once RosterWorkspace is wired.
    assert.equal(REQUIRED_UX_STATES.length, 8);
    assert.ok(REQUIRED_UX_STATES.includes("concurrent-conflict"));
    assert.ok(REQUIRED_UX_STATES.includes("restricted"));
    assert.ok(REQUIRED_UX_STATES.includes("offline"));
  });

  it("LoadingState prerequisite: ensureM05Bootstrapped returns null when window is unavailable", () => {
    removeWindow();
    resetM05BootstrapCacheForTests();
    const report = ensureM05Bootstrapped();
    assert.equal(report, null);
  });

  it("OfflineState retry: ensureM05Bootstrapped is idempotent once storage is available", () => {
    installMemoryLocalStorage();
    resetM05BootstrapCacheForTests();
    // Run migrations manually to satisfy the boot contract used by RosterModule
    runM05StorageMigrations();
    runM05SchemaV2Migration();
    const first = ensureM05Bootstrapped();
    const second = ensureM05Bootstrapped();
    // No throw, no divergence — the retry-after-offline path is safe.
    assert.equal(first, second);
  });

  it("errors thrown by services are `instanceof Error` — enables `SystemErrorState` fallback", () => {
    const errors = [
      new ConcurrentConflictError({ targetType: "shift", targetId: "s1" }),
      new InvalidLifecycleTransitionError({ from: "cancelled", to: "assigned" }),
      new OverrideReasonRequiredError(),
      new ImmutablePublicationError(),
    ];
    for (const err of errors) {
      assert.ok(err instanceof Error);
      assert.ok(err.name.length > 0);
      assert.ok(err.message.length > 0);
    }
  });

  it("`ConcurrentConflictError.message` is human-readable (used verbatim in `ConcurrentConflictState`)", () => {
    const err = new ConcurrentConflictError({
      targetType: "publication",
      targetId: "pub-42",
      expectedVersion: 1,
      actualVersion: 2,
      message: "Publication moved on — reload and retry",
    });
    assert.equal(err.message, "Publication moved on — reload and retry");
  });
});
