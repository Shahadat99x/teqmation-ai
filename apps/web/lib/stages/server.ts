import { cache } from "react";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/intake/server";
import type { LeadRecord } from "@/lib/intake/types";
import type {
  LeadStageHistoryRecord,
  PipelineOverview,
  StageDashboardOverview,
  StageRecord,
} from "@/lib/stages/types";

type RawLeadRecord = Omit<LeadRecord, "current_stage"> & {
  current_stage: { id: string; name: string }[] | { id: string; name: string } | null;
};

type RawLeadStageHistory = {
  id: string;
  lead_id: string;
  from_stage_id: string | null;
  to_stage_id: string;
  changed_by_user_id: string | null;
  changed_at: string;
  automation_processed_at: string | null;
};

function normalizeLeadRecord(lead: RawLeadRecord): LeadRecord {
  const currentStage = Array.isArray(lead.current_stage)
    ? lead.current_stage[0] ?? null
    : lead.current_stage;

  return {
    ...lead,
    current_stage: currentStage,
  };
}

function mapStageHistory(
  historyRows: RawLeadStageHistory[],
  stages: StageRecord[],
): LeadStageHistoryRecord[] {
  const stageMap = new Map(stages.map((stage) => [stage.id, stage]));

  return historyRows.map((history) => {
    const toStage = stageMap.get(history.to_stage_id);

    if (!toStage) {
      throw new Error("Stage history is missing a target stage.");
    }

    return {
      ...history,
      from_stage: history.from_stage_id ? stageMap.get(history.from_stage_id) ?? null : null,
      to_stage: toStage,
    };
  });
}

export const listPipelineStages = cache(async (): Promise<StageRecord[]> => {
  await getWorkspaceContext();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("pipeline_stages")
    .select("id, name, sort_order, is_default")
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`Unable to load pipeline stages: ${error.message}`);
  }

  return (data ?? []) as StageRecord[];
});

export async function getLeadStageHistory(leadId: string) {
  const [stages, supabase] = await Promise.all([
    listPipelineStages(),
    createServerSupabaseClient(),
  ]);
  const { data, error } = await supabase
    .from("lead_stage_history")
    .select(
      "id, lead_id, from_stage_id, to_stage_id, changed_by_user_id, changed_at, automation_processed_at",
    )
    .eq("lead_id", leadId)
    .order("changed_at", { ascending: false });

  if (error) {
    throw new Error(`Unable to load lead stage history: ${error.message}`);
  }

  return mapStageHistory((data ?? []) as RawLeadStageHistory[], stages);
}

export const getPipelineOverview = cache(async (): Promise<PipelineOverview> => {
  const [workspace, stages, supabase] = await Promise.all([
    getWorkspaceContext(),
    listPipelineStages(),
    createServerSupabaseClient(),
  ]);
  const { data, error } = await supabase
    .from("leads")
    .select(
      "id, full_name, email, phone, country, desired_destination, intake_term, message, source, created_at, current_stage:pipeline_stages(id, name)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(`Unable to load pipeline leads: ${error.message}`);
  }

  const leads = ((data ?? []) as RawLeadRecord[]).map(normalizeLeadRecord);
  const groups = stages.map((stage) => {
    const stageLeads = leads.filter((lead) => lead.current_stage?.id === stage.id);

    return {
      stage,
      leadCount: stageLeads.length,
      leads: stageLeads,
    };
  });

  return {
    workspace,
    groups,
    totalLeads: leads.length,
  };
});

export const getStageDashboardOverview = cache(
  async (): Promise<StageDashboardOverview> => {
    const [workspace, stages, supabase] = await Promise.all([
      getWorkspaceContext(),
      listPipelineStages(),
      createServerSupabaseClient(),
    ]);

    const { data: leads, error: leadError } = await supabase
      .from("leads")
      .select("current_stage_id")
      .limit(500);

    if (leadError) {
      throw new Error(`Unable to load stage summaries: ${leadError.message}`);
    }

    const { data: historyRows, error: historyError } = await supabase
      .from("lead_stage_history")
      .select(
        "id, lead_id, from_stage_id, to_stage_id, changed_by_user_id, changed_at, automation_processed_at",
      )
      .order("changed_at", { ascending: false })
      .limit(5);

    if (historyError) {
      throw new Error(`Unable to load recent stage changes: ${historyError.message}`);
    }

    const counts = new Map<string, number>();
    for (const lead of leads ?? []) {
      const stageId = (lead as { current_stage_id: string | null }).current_stage_id;

      if (!stageId) {
        continue;
      }

      counts.set(stageId, (counts.get(stageId) ?? 0) + 1);
    }

    return {
      workspace,
      stageSummaries: stages.map((stage) => ({
        stage,
        count: counts.get(stage.id) ?? 0,
      })),
      recentStageChanges: mapStageHistory(
        (historyRows ?? []) as RawLeadStageHistory[],
        stages,
      ),
    };
  },
);
