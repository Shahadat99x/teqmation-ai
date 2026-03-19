"use server";

import { revalidatePath } from "next/cache";

import {
  buildFollowUpFormState,
  buildFollowUpFormValues,
  getFollowUpDueAtIso,
  validateFollowUp,
} from "@/lib/follow-ups/validation";
import { isFollowUpStatus } from "@/lib/follow-ups/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function createFollowUpAction(
  leadId: string,
  _previousState: ReturnType<typeof buildFollowUpFormState>,
  formData: FormData,
) {
  const values = buildFollowUpFormValues(formData);
  const errors = validateFollowUp(values);

  if (Object.keys(errors).length > 0) {
    return buildFollowUpFormState(values, errors);
  }

  const dueAt = getFollowUpDueAtIso(values);
  if (!dueAt) {
    return buildFollowUpFormState(values, { dueAt: "Enter a valid due date and time." });
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("create_follow_up", {
    p_channel: values.channel,
    p_due_at: dueAt,
    p_lead_id: leadId,
    p_note: values.note || null,
    p_template_name: values.templateName || null,
  });

  if (error) {
    return buildFollowUpFormState(
      values,
      {},
      error.message ?? "Unable to schedule the follow-up right now.",
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/follow-ups");
  revalidatePath(`/leads/${leadId}`);

  return buildFollowUpFormState(undefined, {}, "Follow-up scheduled.");
}

export async function updateFollowUpStatusAction(formData: FormData) {
  const followUpId = String(formData.get("followUpId") ?? "").trim();
  const nextStatus = String(formData.get("status") ?? "").trim();
  const leadId = String(formData.get("leadId") ?? "").trim();

  if (!followUpId || !isFollowUpStatus(nextStatus)) {
    return;
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("update_follow_up_status", {
    p_follow_up_id: followUpId,
    p_status: nextStatus,
  });

  if (error) {
    throw new Error(`Unable to update the follow-up status: ${error.message}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/follow-ups");

  if (leadId) {
    revalidatePath(`/leads/${leadId}`);
  }
}
