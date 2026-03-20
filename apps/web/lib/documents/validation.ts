import {
  emptyDocumentRequestFormValues,
  emptyPublicDocumentUploadFormValues,
  isDocumentType,
  type DocumentRequestFormErrors,
  type DocumentRequestFormState,
  type DocumentRequestFormValues,
  type PublicDocumentUploadFormErrors,
  type PublicDocumentUploadFormState,
  type PublicDocumentUploadFormValues,
} from "@/lib/documents/types";

const maxFileSizeBytes = 10 * 1024 * 1024;
const allowedMimeTypes = ["application/pdf", "image/jpeg", "image/png"];

function cleanValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export function buildDocumentRequestFormValues(
  formData: FormData,
  overrides?: Partial<DocumentRequestFormValues>,
): DocumentRequestFormValues {
  const documentTypes = formData
    .getAll("documentTypes")
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);

  return {
    documentTypes,
    dueDate: cleanValue(formData.get("dueDate")),
    note: cleanValue(formData.get("note")),
    ...overrides,
  };
}

export function buildDocumentRequestFormState(
  values?: Partial<DocumentRequestFormValues>,
  errors: DocumentRequestFormErrors = {},
  message?: string,
  uploadUrl?: string,
): DocumentRequestFormState {
  return {
    values: {
      ...emptyDocumentRequestFormValues,
      ...values,
    },
    errors,
    message,
    uploadUrl,
  };
}

export function validateDocumentRequest(values: DocumentRequestFormValues) {
  const errors: DocumentRequestFormErrors = {};

  if (values.documentTypes.length === 0) {
    errors.documentTypes = "Select at least one document item.";
  }

  if (values.documentTypes.some((value) => !isDocumentType(value))) {
    errors.documentTypes = "One or more selected document types are invalid.";
  }

  if (values.note.length > 500) {
    errors.note = "Keep request notes under 500 characters.";
  }

  if (values.dueDate) {
    const date = new Date(`${values.dueDate}T23:59:59Z`);

    if (Number.isNaN(date.getTime())) {
      errors.dueDate = "Enter a valid due date.";
    }
  }

  return errors;
}

export function getDocumentRequestDueAtIso(values: DocumentRequestFormValues) {
  if (!values.dueDate) {
    return null;
  }

  const date = new Date(`${values.dueDate}T23:59:59Z`);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function buildPublicDocumentUploadFormValues(
  formData: FormData,
  overrides?: Partial<PublicDocumentUploadFormValues>,
): PublicDocumentUploadFormValues {
  return {
    requestId: cleanValue(formData.get("requestId")),
    documentType: cleanValue(formData.get("documentType")) || "other",
    uploaderName: cleanValue(formData.get("uploaderName")),
    uploaderEmail: cleanValue(formData.get("uploaderEmail")),
    ...overrides,
  };
}

export function buildPublicDocumentUploadFormState(
  values?: Partial<PublicDocumentUploadFormValues>,
  errors: PublicDocumentUploadFormErrors = {},
  message?: string,
): PublicDocumentUploadFormState {
  return {
    values: {
      ...emptyPublicDocumentUploadFormValues,
      ...values,
    },
    errors,
    message,
  };
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePublicDocumentUpload(
  values: PublicDocumentUploadFormValues,
  file: File | null,
) {
  const errors: PublicDocumentUploadFormErrors = {};

  if (!values.documentType || !isDocumentType(values.documentType)) {
    errors.documentType = "Choose a valid document type.";
  }

  if (values.uploaderName.length < 2) {
    errors.uploaderName = "Enter the uploader's name.";
  }

  if (values.uploaderEmail && !isValidEmail(values.uploaderEmail)) {
    errors.uploaderEmail = "Enter a valid email address.";
  }

  if (!file || file.size === 0) {
    errors.file = "Choose a file to upload.";
    return errors;
  }

  if (file.size > maxFileSizeBytes) {
    errors.file = "Keep uploads under 10 MB.";
  }

  if (!allowedMimeTypes.includes(file.type)) {
    errors.file = "Only PDF, JPG, and PNG files are supported right now.";
  }

  return errors;
}
