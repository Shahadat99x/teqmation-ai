"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

import { updateInvoiceStatusAction } from "@/app/(dashboard)/invoices/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { InvoiceStatus } from "@/lib/invoices/types";

type InvoiceStatusFormProps = {
  currentStatus: InvoiceStatus;
  invoiceId: string;
  leadId?: string;
};

const statusOptions: Array<{ label: string; value: InvoiceStatus }> = [
  { label: "Draft", value: "draft" },
  { label: "Sent", value: "sent" },
  { label: "Viewed", value: "viewed" },
  { label: "Paid", value: "paid" },
  { label: "Overdue", value: "overdue" },
  { label: "Cancelled", value: "cancelled" },
];

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} size="sm" type="submit" variant="secondary">
      {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
      {pending ? "Saving..." : "Update"}
    </Button>
  );
}

export function InvoiceStatusForm({
  currentStatus,
  invoiceId,
  leadId,
}: InvoiceStatusFormProps) {
  return (
    <form action={updateInvoiceStatusAction} className="flex flex-wrap gap-2">
      <input name="invoiceId" type="hidden" value={invoiceId} />
      <input name="leadId" type="hidden" value={leadId ?? ""} />
      <select
        className={cn(
          "flex h-9 min-w-36 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
        defaultValue={currentStatus}
        name="status"
      >
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <SubmitButton />
    </form>
  );
}
