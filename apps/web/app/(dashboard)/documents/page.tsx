import Link from "next/link";
import { ExternalLink, FileCheck2 } from "lucide-react";

import { DocumentRequestChecklist } from "@/components/documents/document-request-checklist";
import { UploadedDocumentsList } from "@/components/documents/uploaded-documents-list";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDocumentsOverview } from "@/lib/documents/server";
import { cn } from "@/lib/utils";

const metricCards = [
  {
    key: "requestedCount",
    label: "Requested",
    variant: "info" as const,
  },
  {
    key: "uploadedCount",
    label: "Uploaded",
    variant: "success" as const,
  },
  {
    key: "missingCount",
    label: "Missing",
    variant: "warning" as const,
  },
];

export default async function DocumentsPage() {
  const overview = await getDocumentsOverview();
  const metricValues = {
    requestedCount: overview.requestedCount,
    uploadedCount: overview.uploadedCount,
    missingCount: overview.missingCount,
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_50%,#dbeafe_100%)]">
        <CardHeader className="space-y-4">
          <Badge className="w-fit" variant="info">
            Phase 06 live
          </Badge>
          <div className="space-y-2">
            <CardTitle className="text-3xl">Document hub</CardTitle>
            <CardDescription className="max-w-2xl text-base leading-7">
              Request documents, track uploaded vs missing checklist items, and keep private uploads organized inside the workspace.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-600">
              <FileCheck2 className="h-4 w-4 text-sky-600" />
              {overview.workspace.workspaceName} document collection
            </div>
            <Link
              className={cn(buttonVariants({ variant: "secondary" }), "rounded-2xl")}
              href="/leads"
            >
              Open leads
            </Link>
          </div>
        </CardHeader>
      </Card>

      <section className="grid gap-6 md:grid-cols-3">
        {metricCards.map((card) => (
          <Card key={card.key}>
            <CardHeader>
              <Badge className="w-fit" variant={card.variant}>
                {metricValues[card.key as keyof typeof metricValues]}
              </Badge>
              <CardTitle>{card.label}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Requested checklist items</CardTitle>
            <CardDescription>
              Pending and completed document requests across the workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {overview.requests.length > 0 ? (
              <ul className="space-y-3">
                {overview.requests.map((request) => (
                  <li
                    className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4"
                    key={request.id}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-2">
                        <Link
                          className="text-sm font-semibold text-slate-950 hover:text-sky-700"
                          href={request.lead ? `/leads/${request.lead.id}` : "/leads"}
                        >
                          {request.lead?.full_name ?? "Lead record"}
                        </Link>
                        <div className="max-w-xl">
                          <DocumentRequestChecklist
                            emptyMessage=""
                            requests={[
                              {
                                id: request.id,
                                lead_id: request.lead_id,
                                upload_link_id: request.upload_link_id,
                                document_type: request.document_type,
                                label: request.label,
                                status: request.status,
                                due_at: request.due_at,
                                created_at: request.created_at,
                                uploaded_at: request.uploaded_at,
                              },
                            ]}
                          />
                        </div>
                      </div>
                      {request.lead?.email ? (
                        <a
                          className="inline-flex items-center gap-2 text-sm font-medium text-sky-700"
                          href={`mailto:${request.lead.email}`}
                        >
                          Email lead
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                No document requests have been created yet. Start from a lead detail page.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent uploads</CardTitle>
            <CardDescription>
              Private files that were uploaded through secure request links.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UploadedDocumentsList
              emptyMessage="No files have been uploaded yet."
              uploads={overview.uploads.map((upload) => ({
                id: upload.id,
                lead_id: upload.lead_id,
                request_id: upload.request_id,
                upload_link_id: upload.upload_link_id,
                document_type: upload.document_type,
                file_name: upload.file_name,
                storage_bucket: upload.storage_bucket,
                storage_path: upload.storage_path,
                file_size_bytes: upload.file_size_bytes,
                mime_type: upload.mime_type,
                uploaded_by_name: upload.uploaded_by_name,
                uploaded_by_email: upload.uploaded_by_email,
                created_at: upload.created_at,
              }))}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
