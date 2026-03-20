import type { LeadRecord, WorkspaceContext } from "@/lib/intake/types";

export const defaultPipelineStages = [
  "New Lead",
  "Contacted",
  "Interested",
  "Waiting for Documents",
  "Documents Complete",
  "Invoice Sent",
  "Payment Received",
  "Application In Progress",
  "Completed",
] as const;

export type StageRecord = {
  id: string;
  name: string;
  sort_order: number;
  is_default: boolean;
};

export type LeadStageHistoryRecord = {
  id: string;
  lead_id: string;
  from_stage_id: string | null;
  to_stage_id: string;
  changed_by_user_id: string | null;
  changed_at: string;
  automation_processed_at: string | null;
  from_stage: StageRecord | null;
  to_stage: StageRecord;
};

export type PipelineStageGroup = {
  stage: StageRecord;
  leadCount: number;
  leads: LeadRecord[];
};

export type PipelineOverview = {
  workspace: WorkspaceContext;
  groups: PipelineStageGroup[];
  totalLeads: number;
};

export type StageDashboardOverview = {
  workspace: WorkspaceContext;
  stageSummaries: Array<{
    stage: StageRecord;
    count: number;
  }>;
  recentStageChanges: LeadStageHistoryRecord[];
};

export type StageChangeFormState = {
  selectedStageId: string;
  error?: string;
  message?: string;
};
