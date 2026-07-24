/**
 * Executive Command Centre projection contract.
 * Module 2 provides operational summaries; Module 1 keeps executive-only actions.
 */

export interface ExecutiveInboxSummary {
  openCount: number;
  overdueCount: number;
  urgentCount: number;
  escalatedCount: number;
  byClinic: {
    clinicId: string;
    clinicName: string;
    open: number;
    overdue: number;
    urgent: number;
  }[];
  byCategory: {
    category: "Approval" | "Exception" | "Escalation" | "Reminder";
    open: number;
    overdue: number;
  }[];
  sampleActions: Array<{
    id: string;
    number: string;
    title: string;
    priority: string;
    clinicName: string;
    dueAt: string;
    overdue: boolean;
    href: string;
    origin: "action-inbox";
  }>;
  generatedAt: string;
}
