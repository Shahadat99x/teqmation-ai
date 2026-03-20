import type { DocumentRecord } from "@/lib/documents/types";
import { formatDateTime, formatFileSize } from "@/lib/utils";

export function UploadedDocumentsList({
  emptyMessage,
  uploads,
}: {
  emptyMessage: string;
  uploads: DocumentRecord[];
}) {
  if (uploads.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {uploads.map((upload) => (
        <li
          className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4"
          key={upload.id}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-950">{upload.file_name}</p>
              <p className="text-sm text-slate-500">
                {upload.document_type} • {formatFileSize(upload.file_size_bytes)} • {upload.mime_type}
              </p>
              <p className="text-sm text-slate-500">
                {upload.uploaded_by_name || "Uploader not named"}
                {upload.uploaded_by_email ? ` • ${upload.uploaded_by_email}` : ""}
              </p>
            </div>
            <p className="text-xs text-slate-500">{formatDateTime(upload.created_at)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
