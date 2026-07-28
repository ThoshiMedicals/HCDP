/**
 * Shared M06 service error classes.
 * ConcurrentConflictError reflects local optimistic-version protection only
 * (not production-grade concurrency).
 */

export class ConcurrentConflictError extends Error {
  readonly expectedVersion?: number;
  readonly actualVersion?: number;
  readonly targetType: string;
  readonly targetId: string;
  constructor(input: {
    targetType: string;
    targetId: string;
    expectedVersion?: number;
    actualVersion?: number;
    message?: string;
  }) {
    super(
      input.message ??
        `Concurrent conflict on ${input.targetType} ${input.targetId} — expected v${input.expectedVersion ?? "?"} but current v${input.actualVersion ?? "?"}. Refresh and reapply.`
    );
    this.name = "ConcurrentConflictError";
    this.targetType = input.targetType;
    this.targetId = input.targetId;
    this.expectedVersion = input.expectedVersion;
    this.actualVersion = input.actualVersion;
  }
}

export class InvalidLifecycleTransitionError extends Error {
  readonly from: string;
  readonly to: string;
  constructor(input: { from: string; to: string; message?: string; targetType?: string }) {
    super(
      input.message ??
        `Invalid ${input.targetType ?? "record"} lifecycle transition ${input.from} → ${input.to}`
    );
    this.name = "InvalidLifecycleTransitionError";
    this.from = input.from;
    this.to = input.to;
  }
}

export class OverrideReasonRequiredError extends Error {
  constructor(message = "An override reason is required for this action") {
    super(message);
    this.name = "OverrideReasonRequiredError";
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class UnresolvedTimezoneError extends Error {
  readonly reason: string;
  constructor(reason: string, message: string) {
    super(message);
    this.name = "UnresolvedTimezoneError";
    this.reason = reason;
  }
}
