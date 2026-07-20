import type { HealthBand, PriorityLevel } from "./types";

export function timeOfDayGreeting(date = new Date()): "Good morning" | "Good afternoon" | "Good evening" {
  const h = Number(
    new Intl.DateTimeFormat("en-AU", { hour: "numeric", hour12: false, timeZone: "Australia/Brisbane" }).format(date)
  );
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function formatDisplayDate(date = new Date()): string {
  return date.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Australia/Brisbane",
  });
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatMoneyExact(value: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
  }).format(value);
}

export function healthBand(score: number | null): HealthBand {
  if (score === null) return "Data incomplete";
  if (score >= 90) return "Healthy";
  if (score >= 80) return "On Track";
  if (score >= 65) return "Attention Required";
  return "Urgent Review";
}

export function bandTone(band: HealthBand): "success" | "info" | "warn" | "danger" | "default" {
  if (band === "Healthy") return "success";
  if (band === "On Track") return "info";
  if (band === "Attention Required") return "warn";
  if (band === "Urgent Review") return "danger";
  return "default";
}

export function priorityTone(
  priority: PriorityLevel
): "danger" | "warn" | "info" | "success" | "default" {
  switch (priority) {
    case "Emergency":
    case "Urgent":
    case "Overdue":
      return "danger";
    case "Attention Required":
      return "warn";
    case "Routine":
      return "info";
    case "Completed Today":
      return "success";
    default:
      return "default";
  }
}

export function priorityRank(priority: PriorityLevel): number {
  const order: PriorityLevel[] = [
    "Emergency",
    "Urgent",
    "Attention Required",
    "Overdue",
    "Routine",
    "Completed Today",
  ];
  return order.indexOf(priority);
}

export function overallFromAreas(scores: Array<number | null>): number | null {
  const present = scores.filter((s): s is number => s !== null);
  if (present.length === 0) return null;
  return Math.round(present.reduce((a, b) => a + b, 0) / present.length);
}

export function nextRefreshAt(lastUpdated: Date, intervalMs = 5 * 60 * 1000): Date {
  return new Date(lastUpdated.getTime() + intervalMs);
}

export function formatClock(date: Date): string {
  return date.toLocaleTimeString("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Australia/Brisbane",
  });
}
