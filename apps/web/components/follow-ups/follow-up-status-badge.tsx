import { Badge } from "@/components/ui/badge";
import type { FollowUpStatus } from "@/lib/follow-ups/types";

const statusCopy: Record<FollowUpStatus, string> = {
  pending: "Pending",
  sent: "Sent",
  completed: "Completed",
  skipped: "Skipped",
};

const statusVariant: Record<FollowUpStatus, "default" | "info" | "success" | "warning"> = {
  pending: "warning",
  sent: "info",
  completed: "success",
  skipped: "default",
};

export function FollowUpStatusBadge({ status }: { status: FollowUpStatus }) {
  return <Badge variant={statusVariant[status]}>{statusCopy[status]}</Badge>;
}
