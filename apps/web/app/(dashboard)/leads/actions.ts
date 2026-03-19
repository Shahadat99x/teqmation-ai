"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  buildLeadFormState,
  buildLeadFormValues,
  validateManualLead,
} from "@/lib/intake/validation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function createManualLeadAction(
  _previousState: ReturnType<typeof buildLeadFormState>,
  formData: FormData,
) {
  const values = buildLeadFormValues(formData);
  const errors = validateManualLead(values);

  if (Object.keys(errors).length > 0) {
    return buildLeadFormState(values, errors);
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("create_manual_lead", {
    p_country: values.country || null,
    p_desired_destination: values.desiredDestination || null,
    p_email: values.email || null,
    p_full_name: values.fullName,
    p_intake_term: values.intakeTerm || null,
    p_message: values.message || null,
    p_phone: values.phone || null,
    p_source: values.source,
  });

  if (error || !data) {
    return buildLeadFormState(
      values,
      {},
      error?.message ?? "Unable to create the lead right now.",
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/leads");
  redirect(`/leads/${data}`);
}

