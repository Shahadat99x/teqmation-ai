"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  buildPublicDocumentUploadFormState,
  buildPublicDocumentUploadFormValues,
  validatePublicDocumentUpload,
} from "@/lib/documents/validation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getUploadLinkStorageContext } from "@/lib/documents/server";
import { sanitizeFileName } from "@/lib/utils";

export async function uploadDocumentAction(
  token: string,
  _previousState: ReturnType<typeof buildPublicDocumentUploadFormState>,
  formData: FormData,
) {
  const values = buildPublicDocumentUploadFormValues(formData);
  const fileEntry = formData.get("file");
  const file = fileEntry instanceof File ? fileEntry : null;
  const errors = validatePublicDocumentUpload(values, file);

  if (Object.keys(errors).length > 0) {
    return buildPublicDocumentUploadFormState(values, errors);
  }

  const uploadContext = await getUploadLinkStorageContext(token);

  if (!uploadContext) {
    return buildPublicDocumentUploadFormState(
      values,
      {},
      "This upload link is invalid or expired.",
    );
  }

  const requestSegment = values.requestId || values.documentType;
  const fileName = sanitizeFileName(file!.name);
  const storagePath = `${uploadContext.workspaceSlug}/${uploadContext.leadId}/${requestSegment}/${Date.now()}-${fileName}`;
  const admin = createAdminSupabaseClient();
  const bucketName = "lead-documents";

  const { error: uploadError } = await admin.storage
    .from(bucketName)
    .upload(storagePath, file!, {
      contentType: file!.type,
      upsert: false,
    });

  if (uploadError) {
    return buildPublicDocumentUploadFormState(
      values,
      {},
      uploadError.message ?? "Unable to upload the file right now.",
    );
  }

  const { error: recordError } = await admin.rpc("record_document_upload", {
    p_document_type: values.documentType,
    p_file_name: file!.name,
    p_file_size_bytes: file!.size,
    p_mime_type: file!.type,
    p_request_id: values.requestId || null,
    p_storage_bucket: bucketName,
    p_storage_path: storagePath,
    p_token: token,
    p_uploaded_by_email: values.uploaderEmail || null,
    p_uploaded_by_name: values.uploaderName,
  });

  if (recordError) {
    await admin.storage.from(bucketName).remove([storagePath]);

    return buildPublicDocumentUploadFormState(
      values,
      {},
      recordError.message ?? "Unable to save the upload metadata right now.",
    );
  }

  revalidatePath("/documents");
  revalidatePath(`/leads/${uploadContext.leadId}`);
  redirect(`/upload/${token}?uploaded=1`);
}
