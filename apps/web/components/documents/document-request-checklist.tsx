import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import type { DocumentRequestRecord } from "@/lib/documents/types";
import { getDocumentDisplayStatus } from "@/lib/documents/server";
import { formatDate } from "@/lib/utils";

export function DocumentRequestChecklist({
  emptyMessage,
  requests,
}: {
  emptyMessage: string;
  requests: DocumentRequestRecord[];
}) {
  if (requests.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {requests.map((request) => {
        const status = getDocumentDisplayStatus(request);

        return (
          <li
            className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4"
            key={request.id}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-950">{request.label}</p>
                <div className="flex flex-wrap gap-2">
                  <DocumentStatusBadge status={status} />
                </div>
              </div>
              <div className="text-right text-xs text-slate-500">
                {request.due_at ? <p>Due {formatDate(request.due_at)}</p> : <p>No due date</p>}
                {request.uploaded_at ? <p>Uploaded {formatDate(request.uploaded_at)}</p> : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
