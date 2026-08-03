"use client";

import { Button } from "@/components/ui/Button";
import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";
import { useOrganisation } from "@/lib/organisation/context";
import type { OrgState } from "@/lib/organisation/types";
import { SectionHeader } from "./org-ui";

function csvEscape(value: unknown): string {
  const s = value === undefined || value === null ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "No data available for this report.";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(","));
  }
  return lines.join("\n");
}

function downloadBlob(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function reportRows(reportId: string, state: OrgState): Record<string, unknown>[] {
  switch (reportId) {
    case "rp1":
      return state.clinics.map((c) => ({
        id: c.id,
        name: c.name,
        shortName: c.shortName,
        status: c.status,
        practiceManager: c.practiceManager,
        activeUsers: c.activeUsers,
        warnings: c.warnings.join("; "),
      }));
    case "rp2":
      return state.users.map((u) => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        role: u.role,
        status: u.status,
        primaryClinicId: u.primaryClinicId,
      }));
    case "rp3":
      return state.reviews.map((r) => ({
        id: r.id,
        user: r.userName,
        clinicId: r.clinicId,
        trigger: r.trigger,
        status: r.status,
        dueDate: r.dueDate,
        riskLevel: r.riskLevel,
      }));
    case "rp4":
      return [
        ...state.users
          .filter((u) => u.status === "Employment Ended" || u.status === "Archived")
          .map((u) => ({ type: "User", id: u.id, name: `${u.firstName} ${u.lastName}`, status: u.status })),
        ...state.clinics
          .filter((c) => c.status === "Merged" || c.status === "Permanently Closed" || c.status === "Sold or Transferred")
          .map((c) => ({ type: "Clinic", id: c.id, name: c.name, status: c.status })),
      ];
    case "rp5":
      return state.audit
        .filter((a) => a.entityType === "Permission" || a.entityType === "Approval" || a.entityType === "Export" || a.entityType === "Security")
        .map((a) => ({ at: a.at, actor: a.actorName, entityType: a.entityType, entityLabel: a.entityLabel, field: a.field, reason: a.reason }));
    case "rp6":
      return state.assignments
        .filter((a) => a.endDate && (a.type === "Temporary Cover" || a.type === "Emergency Access"))
        .map((a) => ({ userId: a.userId, clinicId: a.clinicId, type: a.type, startDate: a.startDate, endDate: a.endDate }));
    case "rp7":
      return state.alerts.map((a) => ({ id: a.id, title: a.title, category: a.category, risk: a.risk, resolved: a.resolved, createdAt: a.createdAt }));
    default:
      return [];
  }
}

export function ReportsSection() {
  const { state, recordExport } = useOrganisation();

  const exportReport = (reportId: string, name: string, format: "PDF" | "Spreadsheet" | "Print") => {
    recordExport(name, format);
    const rows = reportRows(reportId, state);
    const safeName = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (format === "Spreadsheet") {
      downloadBlob(`${safeName}.csv`, toCsv(rows), "text/csv;charset=utf-8");
      return;
    }
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${name}</title>
<style>
body{font-family:Arial,sans-serif;padding:24px;color:#1f2937;}
h1{font-size:18px;margin-bottom:4px;}
p.meta{color:#64748b;font-size:12px;margin-top:0;}
table{border-collapse:collapse;width:100%;margin-top:16px;}
th,td{border:1px solid #e2e8f0;padding:6px 10px;font-size:12px;text-align:left;}
th{background:#f8fafc;}
</style></head><body>
<h1>${name}</h1>
<p class="meta">Print / PDF preview · generated ${new Date().toLocaleString()} · Healthcare Doctors Pulse — Module 3</p>
<table><thead><tr>${rows.length ? Object.keys(rows[0]).map((h) => `<th>${h}</th>`).join("") : "<th>No data</th>"}</tr></thead>
<tbody>${rows
      .map((r) => `<tr>${Object.values(r).map((v) => `<td>${v ?? ""}</td>`).join("")}</tr>`)
      .join("")}</tbody></table>
</body></html>`;
    if (format === "Print") {
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(html);
        win.document.close();
        win.focus();
        win.print();
      }
      return;
    }
    downloadBlob(`${safeName}.html`, html, "text/html;charset=utf-8");
  };

  const grouped = state.reports.reduce<Record<string, typeof state.reports>>((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {});

  return (
    <div className="grid gap-[18px]">
      <SectionHeader
        title="Reports & exports"
        subtitle="All organisation reports with real spreadsheet (CSV) export and print/PDF preview. Exports are audited."
      />

      {Object.entries(grouped).map(([category, reports]) => (
        <Panel key={category}>
          <PanelTitle>{category}</PanelTitle>
          <PanelSub>{reports.length} report{reports.length === 1 ? "" : "s"}</PanelSub>
          <div className="mt-4 grid gap-3">
            {reports.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--line)] p-4">
                <div>
                  <strong className="text-sm">{r.name}</strong>
                  <p className="m-0 mt-1 text-xs text-[var(--muted)]">{r.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button small variant="line" onClick={() => exportReport(r.id, r.name, "PDF")} title="Download PDF/print preview (.html)">PDF</Button>
                  <Button small variant="line" onClick={() => exportReport(r.id, r.name, "Spreadsheet")} title="Download CSV spreadsheet">Spreadsheet</Button>
                  <Button small variant="line" onClick={() => exportReport(r.id, r.name, "Print")} title="Print report">Print</Button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      ))}

      <Panel>
        <PanelTitle>Audit export pack</PanelTitle>
        <PanelSub>Sensitive activity audit for external reviewers.</PanelSub>
        <Button className="mt-3" variant="teal" onClick={() => exportReport("rp5", "Sensitive activity audit", "PDF")}>
          Export audit pack (PDF preview)
        </Button>
      </Panel>
    </div>
  );
}
