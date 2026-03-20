"use server";

import { revalidatePath } from "next/cache";

import {
  buildStageChangeFormState,
  getSelectedStageId,
} from "@/lib/stages/validation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function changeLeadStageAction(
  leadId: string,
  currentStageId: string,
  _previousState: ReturnType<typeof buildStageChangeFormState>,
  formData: FormData,
) {
  const selectedStageId = getSelectedStageId(formData);

  if (!selectedStageId) {
    return buildStageChangeFormState(currentStageId, "Choose a stage.");
  }

  if (selectedStageId === currentStageId) {
    return buildStageChangeFormState(selectedStageId, undefined, "Lead is already in this stage.");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("change_lead_stage", {
    p_lead_id: leadId,
    p_stage_id: selectedStageId,
  });

  if (error) {
    return buildStageChangeFormState(
      selectedStageId,
      error.message ?? "Unable to update the stage right now.",
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath(`/leads/${leadId}`);

  return buildStageChangeFormState(selectedStageId, undefined, "Stage updated.");
}
