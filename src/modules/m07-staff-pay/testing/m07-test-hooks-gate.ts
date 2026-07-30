/**
 * Fail-closed gate for M07 test-only injection hooks (QA-PPA1-001).
 *
 * Hooks are enabled ONLY when running under an explicit Node test allow-list.
 * `typeof process === "undefined"` must NEVER enable hooks (browser / unknown).
 * Production and unspecified environments stay disabled.
 */

export const M07_TEST_HOOKS_ENV = "M07_ALLOW_TEST_HOOKS";

/**
 * Returns true only when hooks may mutate injection state or fire injected failures.
 * Behavioural contract (must remain fail-closed):
 * - no `process` → false
 * - NODE_ENV === "production" → false
 * - NODE_ENV === "test" → true
 * - M07_ALLOW_TEST_HOOKS === "1" → true (explicit opt-in for tsx without NODE_ENV=test)
 * - otherwise (development / unknown) → false
 */
export function areM07TestHooksAllowed(): boolean {
  if (typeof process === "undefined") return false;
  let env: NodeJS.ProcessEnv | undefined;
  try {
    env = process.env;
  } catch {
    return false;
  }
  if (!env || typeof env !== "object") return false;
  if (env.NODE_ENV === "production") return false;
  if (env.NODE_ENV === "test") return true;
  if (env[M07_TEST_HOOKS_ENV] === "1") return true;
  return false;
}

/** Test helper: enable the explicit allow flag used by M07 suites under tsx. */
export function enableM07TestHooksForTests(): void {
  if (typeof process === "undefined") return;
  try {
    process.env[M07_TEST_HOOKS_ENV] = "1";
  } catch {
    /* ignore */
  }
}

/** Test helper: clear the explicit allow flag (does not clear NODE_ENV=test). */
export function disableM07TestHooksForTests(): void {
  if (typeof process === "undefined") return;
  try {
    delete process.env[M07_TEST_HOOKS_ENV];
  } catch {
    /* ignore */
  }
}
