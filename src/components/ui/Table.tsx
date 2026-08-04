export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-w-0 max-w-full overflow-auto rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)]">
      <table className="hcdp-type-table w-full min-w-[800px] border-collapse">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-[var(--v34-card-line)] bg-[var(--soft)] text-left text-[length:var(--type-table)] font-bold uppercase tracking-[0.04em] text-[var(--muted)]">
        {children}
      </tr>
    </thead>
  );
}

export function Th({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return <th className={`px-3.5 py-3 ${className}`}>{children}</th>;
}

export function Td({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <td
      className={`border-b border-[var(--line)] px-3.5 py-3.5 align-middle text-[var(--ink)] last:border-0 ${className}`}
    >
      {children}
    </td>
  );
}
