import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ConcurrentConflictError,
  InvalidLifecycleTransitionError,
  OverrideReasonRequiredError,
} from "../services/errors";

describe("m06 ux-state contracts", () => {
  it("UX concurrent conflict carries version metadata", () => {
    const e = new ConcurrentConflictError({
      targetType: "session",
      targetId: "ats1",
      expectedVersion: 1,
      actualVersion: 2,
    });
    assert.equal(e.name, "ConcurrentConflictError");
    assert.equal(e.expectedVersion, 1);
    assert.equal(e.actualVersion, 2);
  });

  it("UX validation lifecycle encodes from/to", () => {
    const e = new InvalidLifecycleTransitionError({ from: "cancelled", to: "open" });
    assert.equal(e.from, "cancelled");
    assert.equal(e.to, "open");
  });

  it("UX override reason required", () => {
    const e = new OverrideReasonRequiredError();
    assert.equal(e.name, "OverrideReasonRequiredError");
  });

  it("errors are instanceof Error for SystemErrorState", () => {
    assert.ok(new ConcurrentConflictError({ targetType: "x", targetId: "y" }) instanceof Error);
  });
});
