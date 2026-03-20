import { cache } from "react";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/intake/server";
import type {
  DocumentDisplayStatus,
  DocumentRecord,
  DocumentRequestRecord,
  DocumentsOverview,
  LeadDocumentHub,
  PublicUploadContext,
} from "@/lib/documents/types";

type LeadSummary = {
  id: string;
  full_name: string;
  email: string | null;
  source?: string;
};

type WorkspaceSummary = {
  id: string;
  slug: string;
};

function getSingleRelation<T>(value: T[] | T | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function sortRequests<T extends Pick<DocumentRequestRecord, "status" | "due_at" | "created_at">>(
  requests: T[],
) {
  return [...requests].sort((left, right) => {
    if (left.status !== right.status) {
      return left.status === "requested" ? -1 : 1;
    }

    if (left.due_at && right.due_at) {
      return new Date(left.due_at).getTime() - new Date(right.due_at).getTime();
    }

    if (left.due_at) {
      return -1;
    }

    if (right.due_at) {
      return 1;
    }

    return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
  });
}

export function getDocumentDisplayStatus(
  request: Pick<DocumentRequestRecord, "status" | "due_at">,
): DocumentDisplayStatus {
  if (request.status === "uploaded") {
    return "uploaded";
  }

  if (request.due_at && new Date(request.due_at).getTime() < Date.now()) {
    return "missing";
  }

  return "requested";
}

export async function getLeadDocumentHub(leadId: string): Promise<LeadDocumentHub> {
  const [workspace, supabase] = await Promise.all([
    getWorkspaceContext(),
    createServerSupabaseClient(),
  ]);

  const [{ data: requests, error: requestError }, { data: uploads, error: uploadError }, { data: links, error: linkError }] =
    await Promise.all([
      supabase
        .from("document_requests")
        .select(
          "id, lead_id, upload_link_id, document_type, label, status, due_at, created_at, uploaded_at",
        )
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false }),
      supabase
        .from("documents")
        .select(
          "id, lead_id, request_id, upload_link_id, document_type, file_name, storage_bucket, storage_path, file_size_bytes, mime_type, uploaded_by_name, uploaded_by_email, created_at",
        )
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false }),
      supabase
        .from("document_upload_links")
        .select(
          "id, token, note, expires_at, email_sent_at, last_reminder_sent_at, revoked_at, created_at",
        )
        .eq("lead_id", leadId)
        .is("revoked_at", null)
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

  if (requestError) {
    throw new Error(`Unable to load document requests: ${requestError.message}`);
  }

  if (uploadError) {
    throw new Error(`Unable to load uploaded documents: ${uploadError.message}`);
  }

  if (linkError) {
    throw new Error(`Unable to load upload link: ${linkError.message}`);
  }

  return {
    workspace,
    requests: sortRequests((requests ?? []) as DocumentRequestRecord[]),
    uploads: (uploads ?? []) as DocumentRecord[],
    activeUploadLink: ((links ?? [])[0] as LeadDocumentHub["activeUploadLink"]) ?? null,
  };
}

export const getDocumentsOverview = cache(async (): Promise<DocumentsOverview> => {
  const [workspace, supabase] = await Promise.all([
    getWorkspaceContext(),
    createServerSupabaseClient(),
  ]);

  const [{ data: requests, error: requestError }, { data: uploads, error: uploadError }] =
    await Promise.all([
      supabase
        .from("document_requests")
        .select(
          "id, lead_id, upload_link_id, document_type, label, status, due_at, created_at, uploaded_at, lead:leads(id, full_name, email, source)",
        )
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("documents")
        .select(
          "id, lead_id, request_id, upload_link_id, document_type, file_name, storage_bucket, storage_path, file_size_bytes, mime_type, uploaded_by_name, uploaded_by_email, created_at, lead:leads(id, full_name, email)",
        )
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

  if (requestError) {
    throw new Error(`Unable to load document requests overview: ${requestError.message}`);
  }

  if (uploadError) {
    throw new Error(`Unable to load document uploads overview: ${uploadError.message}`);
  }

  const normalizedRequests = sortRequests(
    (requests ?? []).map((request) => ({
      ...(request as Omit<DocumentRequestRecord, "lead">),
      lead: getSingleRelation(
        (request as { lead: LeadSummary[] | LeadSummary | null }).lead,
      ),
    })) as DocumentsOverview["requests"],
  );

  const normalizedUploads = (uploads ?? []).map((upload) => ({
    ...(upload as Omit<DocumentRecord, "lead">),
    lead: getSingleRelation(
      (upload as { lead: LeadSummary[] | LeadSummary | null }).lead,
    ),
  })) as DocumentsOverview["uploads"];

  return {
    workspace,
    requests: normalizedRequests,
    uploads: normalizedUploads,
    requestedCount: normalizedRequests.filter((request) => getDocumentDisplayStatus(request) === "requested").length,
    uploadedCount: normalizedRequests.filter((request) => getDocumentDisplayStatus(request) === "uploaded").length,
    missingCount: normalizedRequests.filter((request) => getDocumentDisplayStatus(request) === "missing").length,
  };
});

export async function getPublicUploadContext(token: string): Promise<PublicUploadContext | null> {
  const admin = createAdminSupabaseClient();

  const { data: link, error: linkError } = await admin
    .from("document_upload_links")
    .select(
      "id, token, note, expires_at, email_sent_at, last_reminder_sent_at, revoked_at, created_at, lead:leads(id, full_name, email)",
    )
    .eq("token", token)
    .is("revoked_at", null)
    .maybeSingle();

  if (linkError) {
    throw new Error(`Unable to load upload link: ${linkError.message}`);
  }

  if (!link) {
    return null;
  }

  const lead = getSingleRelation(
    (link as { lead: LeadSummary[] | LeadSummary | null }).lead,
  );

  if (!lead || new Date(link.expires_at).getTime() <= Date.now()) {
    return null;
  }

  const { data: requests, error: requestError } = await admin
    .from("document_requests")
    .select(
      "id, lead_id, upload_link_id, document_type, label, status, due_at, created_at, uploaded_at",
    )
    .eq("upload_link_id", link.id)
    .order("created_at", { ascending: true });

  if (requestError) {
    throw new Error(`Unable to load upload checklist: ${requestError.message}`);
  }

  return {
    lead: {
      id: lead.id,
      fullName: lead.full_name,
      email: lead.email ?? null,
    },
    uploadLink: {
      id: link.id,
      token: link.token,
      note: link.note,
      expires_at: link.expires_at,
      email_sent_at: link.email_sent_at,
      last_reminder_sent_at: link.last_reminder_sent_at,
      revoked_at: link.revoked_at,
      created_at: link.created_at,
    },
    requests: sortRequests((requests ?? []) as DocumentRequestRecord[]),
  };
}

export async function getUploadLinkStorageContext(token: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("document_upload_links")
    .select(
      "id, token, workspace:workspaces!document_upload_links_workspace_id_fkey(id, slug), lead:leads(id)",
    )
    .eq("token", token)
    .is("revoked_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load upload storage context: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const workspace = getSingleRelation(
    (data as { workspace: WorkspaceSummary[] | WorkspaceSummary | null }).workspace,
  );
  const lead = getSingleRelation(
    (data as { lead: { id: string }[] | { id: string } | null }).lead,
  );

  if (!workspace || !lead) {
    return null;
  }

  return {
    uploadLinkId: data.id,
    workspaceId: workspace.id,
    workspaceSlug: workspace.slug,
    leadId: lead.id,
  };
}
