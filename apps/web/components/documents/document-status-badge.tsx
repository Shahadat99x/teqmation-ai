import { Badge } from "@/components/ui/badge";
import type { DocumentDisplayStatus } from "@/lib/documents/types";

const statusCopy: Record<DocumentDisplayStatus, string> = {
  requested: "Requested",
  uploaded: "Uploaded",
  missing: "Missing",
};

const statusVariant: Record<
  DocumentDisplayStatus,
  "default" | "info" | "success" | "warning"
> = {
  requested: "info",
  uploaded: "success",
  missing: "warning",
};

export function DocumentStatusBadge({ status }: { status: DocumentDisplayStatus }) {
  return <Badge variant={statusVariant[status]}>{statusCopy[status]}</Badge>;
}
