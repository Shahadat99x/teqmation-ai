import type { WorkspaceContext } from "@/lib/intake/types";

export const documentTypes = [
  "passport",
  "transcript",
  "IELTS",
  "CV",
  "photo",
  "other",
] as const;

export type DocumentType = (typeof documentTypes)[number];
export type DocumentRequestStatus = "requested" | "uploaded";
export type DocumentDisplayStatus = "requested" | "uploaded" | "missing";

export type DocumentUploadLinkRecord = {
  id: string;
  token: string;
  note: string | null;
  expires_at: string;
  email_sent_at: string | null;
  last_reminder_sent_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

export type DocumentRequestRecord = {
  id: string;
  lead_id: string;
  upload_link_id: string;
  document_type: DocumentType;
  label: string;
  status: DocumentRequestStatus;
  due_at: string | null;
  created_at: string;
  uploaded_at: string | null;
};

export type DocumentRecord = {
  id: string;
  lead_id: string;
  request_id: string | null;
  upload_link_id: string | null;
  document_type: DocumentType;
  file_name: string;
  storage_bucket: string;
  storage_path: string;
  file_size_bytes: number;
  mime_type: string;
  uploaded_by_name: string | null;
  uploaded_by_email: string | null;
  created_at: string;
};

export type LeadDocumentHub = {
  workspace: WorkspaceContext;
  requests: DocumentRequestRecord[];
  uploads: DocumentRecord[];
  activeUploadLink: DocumentUploadLinkRecord | null;
};

export type DocumentsOverview = {
  workspace: WorkspaceContext;
  requests: Array<
    DocumentRequestRecord & {
      lead: {
        id: string;
        full_name: string;
        email: string | null;
        source: string;
      } | null;
    }
  >;
  uploads: Array<
    DocumentRecord & {
      lead: {
        id: string;
        full_name: string;
        email: string | null;
      } | null;
    }
  >;
  requestedCount: number;
  uploadedCount: number;
  missingCount: number;
};

export type PublicUploadContext = {
  lead: {
    id: string;
    fullName: string;
    email: string | null;
  };
  uploadLink: DocumentUploadLinkRecord;
  requests: DocumentRequestRecord[];
};

export type DocumentRequestFormValues = {
  documentTypes: string[];
  dueDate: string;
  note: string;
};

export type DocumentRequestFormErrors = Partial<
  Record<"documentTypes" | "dueDate" | "note" | "form", string>
>;

export type DocumentRequestFormState = {
  values: DocumentRequestFormValues;
  errors: DocumentRequestFormErrors;
  message?: string;
  uploadUrl?: string;
};

export type PublicDocumentUploadFormValues = {
  requestId: string;
  documentType: string;
  uploaderName: string;
  uploaderEmail: string;
};

export type PublicDocumentUploadFormErrors = Partial<
  Record<
    "requestId" | "documentType" | "uploaderName" | "uploaderEmail" | "file" | "form",
    string
  >
>;

export type PublicDocumentUploadFormState = {
  values: PublicDocumentUploadFormValues;
  errors: PublicDocumentUploadFormErrors;
  message?: string;
};

export const emptyDocumentRequestFormValues: DocumentRequestFormValues = {
  documentTypes: [],
  dueDate: "",
  note: "",
};

export const emptyPublicDocumentUploadFormValues: PublicDocumentUploadFormValues = {
  requestId: "",
  documentType: "other",
  uploaderName: "",
  uploaderEmail: "",
};

export function isDocumentType(value: string): value is DocumentType {
  return documentTypes.includes(value as DocumentType);
}
