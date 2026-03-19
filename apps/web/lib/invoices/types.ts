import type { WorkspaceContext } from "@/lib/intake/types";

export const invoiceStatuses = [
  "draft",
  "sent",
  "viewed",
  "paid",
  "overdue",
  "cancelled",
] as const;

export const openInvoiceStatuses = ["draft", "sent", "viewed", "overdue"] as const;

export type InvoiceStatus = (typeof invoiceStatuses)[number];

export type InvoiceRecord = {
  id: string;
  lead_id: string;
  invoice_number: string;
  amount_cents: number;
  due_at: string;
  status: InvoiceStatus;
  external_payment_link: string | null;
  note: string | null;
  send_requested_at: string | null;
  email_sent_at: string | null;
  last_reminder_sent_at: string | null;
  viewed_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  lead: {
    id: string;
    full_name: string;
    email: string | null;
    source: string;
  } | null;
};

export type InvoiceListOverview = {
  workspace: WorkspaceContext;
  invoices: InvoiceRecord[];
  openCount: number;
  overdueCount: number;
  paidCount: number;
  draftCount: number;
  sentCount: number;
  viewedCount: number;
  cancelledCount: number;
};

export type InvoiceDashboardOverview = {
  openCount: number;
  overdueCount: number;
  paidCount: number;
  overdueInvoices: InvoiceRecord[];
};

export type InvoiceFormValues = {
  amount: string;
  dueDate: string;
  externalPaymentLink: string;
  note: string;
  sendNow: boolean;
};

export type InvoiceFormErrors = Partial<Record<keyof InvoiceFormValues | "form", string>>;

export type InvoiceFormState = {
  values: InvoiceFormValues;
  errors: InvoiceFormErrors;
  message?: string;
};

export const emptyInvoiceFormValues: InvoiceFormValues = {
  amount: "",
  dueDate: "",
  externalPaymentLink: "",
  note: "",
  sendNow: false,
};

export function isInvoiceStatus(value: string): value is InvoiceStatus {
  return invoiceStatuses.includes(value as InvoiceStatus);
}

export function isOpenInvoiceStatus(value: InvoiceStatus) {
  return openInvoiceStatuses.includes(value as (typeof openInvoiceStatuses)[number]);
}

export function getInvoiceDisplayStatus(
  invoice: Pick<InvoiceRecord, "status" | "due_at">,
): InvoiceStatus {
  if (invoice.status === "paid" || invoice.status === "cancelled") {
    return invoice.status;
  }

  if (new Date(invoice.due_at).getTime() <= Date.now()) {
    return "overdue";
  }

  return invoice.status;
}
