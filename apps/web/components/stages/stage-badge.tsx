import { Badge } from "@/components/ui/badge";

function getVariant(stageName: string): "default" | "info" | "success" | "warning" {
  if (stageName === "Completed" || stageName === "Payment Received") {
    return "success";
  }

  if (
    stageName === "Waiting for Documents" ||
    stageName === "Invoice Sent" ||
    stageName === "Documents Complete"
  ) {
    return "warning";
  }

  if (
    stageName === "Contacted" ||
    stageName === "Interested" ||
    stageName === "Application In Progress"
  ) {
    return "info";
  }

  return "default";
}

export function StageBadge({ stageName }: { stageName: string }) {
  return <Badge variant={getVariant(stageName)}>{stageName}</Badge>;
}
