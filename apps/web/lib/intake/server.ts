import { cache } from "react";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  type ActivityRecord,
  type LeadDashboardOverview,
  type LeadRecord,
  type PublicWorkspace,
  type WorkspaceContext,
} from "@/lib/intake/types";

function getSingleRpcRow<T>(data: T[] | T | null) {
  if (Array.isArray(data)) {
    return data[0] ?? null;
  }

  return data ?? null;
}

function normalizeWorkspaceContext(
  workspace:
    | {
        workspace_id: string;
        workspace_name: string;
        workspace_slug: string;
        member_role: string;
      }
    | null,
): WorkspaceContext {
  if (!workspace) {
    throw new Error("Workspace context is not available.");
  }

  return {
    workspaceId: workspace.workspace_id,
    workspaceName: workspace.workspace_name,
    workspaceSlug: workspace.workspace_slug,
    memberRole: workspace.member_role,
  };
}

function normalizeLeadRecord(
  lead: Omit<LeadRecord, "current_stage"> & {
    current_stage: { id: string; name: string }[] | { id: string; name: string } | null;
  },
): LeadRecord {
  const currentStage = Array.isArray(lead.current_stage)
    ? lead.current_stage[0] ?? null
    : lead.current_stage;

  return {
    ...lead,
    current_stage: currentStage,
  };
}

export const getWorkspaceContext = cache(async (): Promise<WorkspaceContext> => {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("ensure_current_workspace");

  if (error) {
    throw new Error(`Unable to load workspace context: ${error.message}`);
  }

  const workspace = getSingleRpcRow(
    data as
      | {
          workspace_id: string;
          workspace_name: string;
          workspace_slug: string;
          member_role: string;
        }[]
      | {
          workspace_id: string;
          workspace_name: string;
          workspace_slug: string;
          member_role: string;
        }
      | null,
  );

  return normalizeWorkspaceContext(workspace);
});

export async function getPublicWorkspaceBySlug(
  workspaceSlug: string,
): Promise<PublicWorkspace | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("get_public_workspace", {
    p_workspace_slug: workspaceSlug,
  });

  if (error) {
    throw new Error(`Unable to load public workspace: ${error.message}`);
  }

  const workspace = getSingleRpcRow(
    data as
      | {
          workspace_id: string;
          workspace_name: string;
          workspace_slug: string;
        }[]
      | {
          workspace_id: string;
          workspace_name: string;
          workspace_slug: string;
        }
      | null,
  );

  if (!workspace) {
    return null;
  }

  return {
    workspaceId: workspace.workspace_id,
    workspaceName: workspace.workspace_name,
    workspaceSlug: workspace.workspace_slug,
  };
}

export async function listLeads(searchQuery?: string) {
  const workspace = await getWorkspaceContext();
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("leads")
    .select(
      "id, full_name, email, phone, country, desired_destination, intake_term, message, source, created_at, current_stage:pipeline_stages(id, name)",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  const normalizedQuery = searchQuery?.trim();
  if (normalizedQuery) {
    query = query.or(
      `full_name.ilike.%${normalizedQuery}%,email.ilike.%${normalizedQuery}%,phone.ilike.%${normalizedQuery}%,source.ilike.%${normalizedQuery}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Unable to load leads: ${error.message}`);
  }

  return {
    workspace,
    leads: ((data ?? []) as Array<
      Omit<LeadRecord, "current_stage"> & {
        current_stage: { id: string; name: string }[] | null;
      }
    >).map(normalizeLeadRecord),
    searchQuery: normalizedQuery ?? "",
  };
}

export async function getLeadDashboardOverview(): Promise<LeadDashboardOverview> {
  const workspace = await getWorkspaceContext();
  const supabase = await createServerSupabaseClient();
  const weekThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [totalResult, publicResult, weekResult, recentResult] = await Promise.all([
    supabase.from("leads").select("id", { count: "exact", head: true }),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("source", "Public Inquiry"),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekThreshold),
    supabase
      .from("leads")
      .select(
        "id, full_name, email, phone, country, desired_destination, intake_term, message, source, created_at, current_stage:pipeline_stages(id, name)",
      )
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (totalResult.error) {
    throw new Error(`Unable to load lead totals: ${totalResult.error.message}`);
  }

  if (publicResult.error) {
    throw new Error(`Unable to load public inquiry totals: ${publicResult.error.message}`);
  }

  if (weekResult.error) {
    throw new Error(`Unable to load weekly lead totals: ${weekResult.error.message}`);
  }

  if (recentResult.error) {
    throw new Error(`Unable to load recent leads: ${recentResult.error.message}`);
  }

  const recentLeads = ((recentResult.data ?? []) as Array<
    Omit<LeadRecord, "current_stage"> & {
      current_stage: { id: string; name: string }[] | null;
    }
  >).map(normalizeLeadRecord);

  const totalLeads = totalResult.count ?? 0;
  const publicInquiryCount = publicResult.count ?? 0;

  return {
    workspace,
    totalLeads,
    publicInquiryCount,
    manualLeadCount: Math.max(totalLeads - publicInquiryCount, 0),
    newThisWeekCount: weekResult.count ?? 0,
    recentLeads,
  };
}

export async function getLeadDetail(leadId: string) {
  const workspace = await getWorkspaceContext();
  const supabase = await createServerSupabaseClient();

  const [{ data: lead, error: leadError }, { data: activities, error: activityError }] =
    await Promise.all([
      supabase
        .from("leads")
        .select(
          "id, full_name, email, phone, country, desired_destination, intake_term, message, source, created_at, current_stage:pipeline_stages(id, name)",
        )
        .eq("id", leadId)
        .maybeSingle(),
      supabase
        .from("activities")
        .select("id, type, title, description, created_at, metadata_json")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false }),
    ]);

  if (leadError) {
    throw new Error(`Unable to load lead detail: ${leadError.message}`);
  }

  if (activityError) {
    throw new Error(`Unable to load lead activities: ${activityError.message}`);
  }

  return {
    workspace,
    lead: lead
      ? normalizeLeadRecord(
          lead as Omit<LeadRecord, "current_stage"> & {
            current_stage: { id: string; name: string }[] | null;
          },
        )
      : null,
    activities: (activities ?? []) as ActivityRecord[],
  };
}
