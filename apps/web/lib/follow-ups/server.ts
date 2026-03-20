import { cache } from "react";

import { getWorkspaceContext } from "@/lib/intake/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  isOpenFollowUpStatus,
  type FollowUpDashboardOverview,
  type FollowUpListOverview,
  type FollowUpRecord,
} from "@/lib/follow-ups/types";

type RawFollowUpRecord = Omit<FollowUpRecord, "lead"> & {
  lead:
    | {
        id: string;
        full_name: string;
        email: string | null;
        source: string;
      }[]
    | {
        id: string;
        full_name: string;
        email: string | null;
        source: string;
      }
    | null;
};

function normalizeFollowUpRecord(followUp: RawFollowUpRecord): FollowUpRecord {
  const lead = Array.isArray(followUp.lead) ? followUp.lead[0] ?? null : followUp.lead;

  return {
    ...followUp,
    lead,
  };
}

function getUtcDayRange() {
  const now = new Date();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0),
  );
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return {
    now: now.toISOString(),
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

export async function listFollowUps(): Promise<FollowUpListOverview> {
  const workspace = await getWorkspaceContext();
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("follow_ups")
    .select(
      "id, lead_id, due_at, status, channel, template_name, note, created_at, last_reminded_at, lead:leads(id, full_name, email, source)",
    )
    .order("due_at", { ascending: true })
    .limit(100);

  if (error) {
    throw new Error(`Unable to load follow-ups: ${error.message}`);
  }

  const followUps = ((data ?? []) as RawFollowUpRecord[]).map(normalizeFollowUpRecord);
  const overdueCount = followUps.filter((followUp) => {
    return (
      isOpenFollowUpStatus(followUp.status) &&
      new Date(followUp.due_at).getTime() < Date.now()
    );
  }).length;

  return {
    workspace,
    followUps,
    openCount: followUps.filter((followUp) => isOpenFollowUpStatus(followUp.status)).length,
    pendingCount: followUps.filter((followUp) => followUp.status === "pending").length,
    sentCount: followUps.filter((followUp) => followUp.status === "sent").length,
    completedCount: followUps.filter((followUp) => followUp.status === "completed").length,
    skippedCount: followUps.filter((followUp) => followUp.status === "skipped").length,
    overdueCount,
  };
}

export async function getLeadFollowUps(leadId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("follow_ups")
    .select(
      "id, lead_id, due_at, status, channel, template_name, note, created_at, last_reminded_at, lead:leads(id, full_name, email, source)",
    )
    .eq("lead_id", leadId)
    .order("due_at", { ascending: true });

  if (error) {
    throw new Error(`Unable to load lead follow-ups: ${error.message}`);
  }

  return ((data ?? []) as RawFollowUpRecord[]).map(normalizeFollowUpRecord);
}

export const getFollowUpDashboardOverview = cache(
  async (): Promise<FollowUpDashboardOverview> => {
    await getWorkspaceContext();
    const supabase = await createServerSupabaseClient();
    const { now, start, end } = getUtcDayRange();

    const [openResult, dueTodayResult, overdueResult, dueListResult] = await Promise.all([
      supabase
        .from("follow_ups")
        .select("id", { count: "exact", head: true })
        .in("status", ["pending", "sent"]),
      supabase
        .from("follow_ups")
        .select("id", { count: "exact", head: true })
        .in("status", ["pending", "sent"])
        .gte("due_at", start)
        .lt("due_at", end),
      supabase
        .from("follow_ups")
        .select("id", { count: "exact", head: true })
        .in("status", ["pending", "sent"])
        .lt("due_at", now),
      supabase
        .from("follow_ups")
        .select(
          "id, lead_id, due_at, status, channel, template_name, note, created_at, last_reminded_at, lead:leads(id, full_name, email, source)",
        )
        .in("status", ["pending", "sent"])
        .lte("due_at", now)
        .order("due_at", { ascending: true })
        .limit(6),
    ]);

    if (openResult.error) {
      throw new Error(`Unable to load open follow-ups: ${openResult.error.message}`);
    }

    if (dueTodayResult.error) {
      throw new Error(`Unable to load due-today follow-ups: ${dueTodayResult.error.message}`);
    }

    if (overdueResult.error) {
      throw new Error(`Unable to load overdue follow-ups: ${overdueResult.error.message}`);
    }

    if (dueListResult.error) {
      throw new Error(`Unable to load due follow-up list: ${dueListResult.error.message}`);
    }

    return {
      openCount: openResult.count ?? 0,
      dueTodayCount: dueTodayResult.count ?? 0,
      overdueCount: overdueResult.count ?? 0,
      dueFollowUps: ((dueListResult.data ?? []) as RawFollowUpRecord[]).map(
        normalizeFollowUpRecord,
      ),
    };
  },
);
