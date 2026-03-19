"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  buildLeadFormState,
  buildLeadFormValues,
  validatePublicInquiry,
} from "@/lib/intake/validation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function createPublicInquiryAction(
  workspaceSlug: string,
  _previousState: ReturnType<typeof buildLeadFormState>,
  formData: FormData,
) {
  const values = buildLeadFormValues(formData, {
    source: "Public Inquiry",
  });
  const errors = validatePublicInquiry(values);

  if (Object.keys(errors).length > 0) {
    return buildLeadFormState(values, errors);
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("create_public_inquiry_lead", {
    p_country: values.country || null,
    p_desired_destination: values.desiredDestination || null,
    p_email: values.email,
    p_full_name: values.fullName,
    p_intake_term: values.intakeTerm || null,
    p_message: values.message || null,
    p_phone: values.phone || null,
    p_source: "Public Inquiry",
    p_workspace_slug: workspaceSlug,
  });

  if (error) {
    return buildLeadFormState(
      values,
      {},
      error.message || "Unable to submit the inquiry right now.",
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/leads");
  redirect(`/inquiry/${workspaceSlug}?submitted=1`);
}
