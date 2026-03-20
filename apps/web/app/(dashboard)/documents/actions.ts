"use server";

import { revalidatePath } from "next/cache";

import { env } from "@/lib/env";
import {
  buildDocumentRequestFormState,
  buildDocumentRequestFormValues,
  getDocumentRequestDueAtIso,
  validateDocumentRequest,
} from "@/lib/documents/validation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function createDocumentRequestAction(
  leadId: string,
  _previousState: ReturnType<typeof buildDocumentRequestFormState>,
  formData: FormData,
) {
  const values = buildDocumentRequestFormValues(formData);
  const errors = validateDocumentRequest(values);

  if (Object.keys(errors).length > 0) {
    return buildDocumentRequestFormState(values, errors);
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("create_document_request_bundle", {
    p_document_types: values.documentTypes,
    p_due_at: getDocumentRequestDueAtIso(values),
    p_lead_id: leadId,
    p_link_expires_at: null,
    p_note: values.note || null,
  });

  if (error || !data) {
    return buildDocumentRequestFormState(
      values,
      {},
      error?.message ?? "Unable to create the document request right now.",
    );
  }

  const uploadUrl = `${env.NEXT_PUBLIC_APP_URL}/upload/${data}`;

  revalidatePath("/documents");
  revalidatePath(`/leads/${leadId}`);

  return buildDocumentRequestFormState(
    {
      documentTypes: [],
      dueDate: values.dueDate,
      note: "",
    },
    {},
    "Document request created.",
    uploadUrl,
  );
}
