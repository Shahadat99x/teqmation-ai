import { Badge } from "@/components/ui/badge";
import type { InvoiceStatus } from "@/lib/invoices/types";

const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

const invoiceStatusVariants: Record<
  InvoiceStatus,
  "default" | "info" | "success" | "warning"
> = {
  draft: "default",
  sent: "info",
  viewed: "info",
  paid: "success",
  overdue: "warning",
  cancelled: "default",
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return <Badge variant={invoiceStatusVariants[status]}>{invoiceStatusLabels[status]}</Badge>;
}
