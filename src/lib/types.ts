export type ModuleId =
  | "dashboard"
  | "action-inbox"
  | "organisation"
  | "staff"
  | "roster"
  | "timeclock"
  | "staffpay"
  | "doctorpay"
  | "bbpip"
  | "tasks"
  | "training"
  | "accreditation"
  | "documents"
  | "ticketing"
  | "inventory"
  | "incidents"
  | "communications"
  | "digital"
  | "analytics"
  | "saas";

export type NavGroupId =
  | "Command"
  | "Workforce"
  | "Operations"
  | "Communications & Digital"
  | "Future Commercial";

export type BadgeTone = "default" | "success" | "warn" | "danger" | "info" | "teal";

export type MetricTone = "default" | "warning" | "danger" | "info" | "success";

export interface Location {
  id: string;
  name: string;
  shortName: string;
  code: string;
  status: "Active" | "Paused" | "Closed";
  manager: string;
  address: string;
  phone: string;
  email: string;
  users: number;
  doctors: number;
  health: "Green" | "Amber" | "Red";
  healthScore: number;
  healthReasons: string[];
}

export interface ActionItem {
  id: string;
  title: string;
  kind: "Approval" | "Manager review" | "Overdue" | "Expired" | "Due soon" | "Exception";
  module: string;
  locationId: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  status: "Open" | "In review" | "Pending approval" | "Overdue";
  owner: string;
  due: string;
  summary: string;
}

export interface TaskItem {
  id: string;
  title: string;
  assignee: string;
  locationId: string;
  status: "Open" | "In progress" | "Done" | "Blocked";
  due: string;
  priority: "Low" | "Medium" | "High";
  type: "Task" | "Checklist" | "Handover";
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  employmentType: string;
  locationId: string;
  status: "Active" | "Pending";
}

export interface DoctorMember {
  id: string;
  name: string;
  locationId: string;
  status: "Active" | "Pending";
  bankReady: boolean;
  ahpraWatch: boolean;
}

export interface DashboardKpis {
  openActions: number;
  rosteredSessions: number;
  openTasks: number;
  openTickets: number;
  expiryRisks: number;
  payExceptions: number;
  activeStaff: number;
  activeDoctors: number;
  clinics: number;
  modules: number;
}

export interface MyDayItem {
  time: string;
  title: string;
  meta: string;
}

export const ALL_LOCATIONS_ID = "all";
