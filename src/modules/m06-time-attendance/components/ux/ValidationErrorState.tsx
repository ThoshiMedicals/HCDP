"use client";

export function ValidationErrorState({ errors }: { errors: string[] }) {
  return (
    <div
      data-ux-state="validation-error"
      data-testid="m06-ux-validation-error"
      role="alert"
      className="grid gap-1 p-4 text-sm"
    >
      {errors.map((e) => (
        <div key={e}>{e}</div>
      ))}
    </div>
  );
}
