import type { WorkspaceContext } from "@/lib/intake/types";

export const followUpStatuses = ["pending", "sent", "completed", "skipped"] as const;
export const followUpChannels = ["internal", "email"] as const;
export const openFollowUpStatuses = ["pending", "sent"] as const;

export type FollowUpStatus = (typeof followUpStatuses)[number];
export type FollowUpChannel = (typeof followUpChannels)[number];

export type FollowUpRecord = {
  id: string;
  lead_id: string;
  due_at: string;
  status: FollowUpStatus;
  channel: FollowUpChannel;
  template_name: string | null;
  note: string | null;
  created_at: string;
  last_reminded_at: string | null;
  lead: {
    id: string;
    full_name: string;
    email: string | null;
    source: string;
  } | null;
};

export type FollowUpListOverview = {
  workspace: WorkspaceContext;
  followUps: FollowUpRecord[];
  openCount: number;
  pendingCount: number;
  sentCount: number;
  completedCount: number;
  skippedCount: number;
  overdueCount: number;
};

export type FollowUpDashboardOverview = {
  openCount: number;
  dueTodayCount: number;
  overdueCount: number;
  dueFollowUps: FollowUpRecord[];
};

export type FollowUpFormValues = {
  dueAt: string;
  channel: string;
  templateName: string;
  note: string;
};

export type FollowUpFormErrors = Partial<
  Record<keyof FollowUpFormValues | "form", string>
>;

export type FollowUpFormState = {
  values: FollowUpFormValues;
  errors: FollowUpFormErrors;
  message?: string;
};

export const emptyFollowUpFormValues: FollowUpFormValues = {
  dueAt: "",
  channel: "internal",
  templateName: "",
  note: "",
};

export function isFollowUpStatus(value: string): value is FollowUpStatus {
  return followUpStatuses.includes(value as FollowUpStatus);
}

export function isFollowUpChannel(value: string): value is FollowUpChannel {
  return followUpChannels.includes(value as FollowUpChannel);
}

export function isOpenFollowUpStatus(value: FollowUpStatus) {
  return value === "pending" || value === "sent";
}
