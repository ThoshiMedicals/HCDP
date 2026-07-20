export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-auto rounded-2xl border border-[var(--line)] bg-white">
      <table className="w-full min-w-[800px] border-collapse">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-[var(--line)] bg-[#fbfcfd] text-left text-xs font-bold text-[#526479]">
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
    <td className={`border-b border-[#f0f3f6] px-3.5 py-3.5 align-middle text-[#24364a] last:border-0 ${className}`}>
      {children}
    </td>
  );
}
