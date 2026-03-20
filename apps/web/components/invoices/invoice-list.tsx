"use client";

import Link from "next/link";
import { ExternalLink, Mail } from "lucide-react";

import { InvoiceStatusForm } from "@/components/invoices/invoice-status-form";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getInvoiceDisplayStatus,
  type InvoiceRecord,
} from "@/lib/invoices/types";
import {
  formatCurrencyFromCents,
  formatDate,
  formatDateTime,
} from "@/lib/utils";

type InvoiceListProps = {
  emptyMessage: string;
  invoices: InvoiceRecord[];
  showLeadLink?: boolean;
  showStatusActions?: boolean;
};

function getDueTone(invoice: InvoiceRecord) {
  const displayStatus = getInvoiceDisplayStatus(invoice);

  if (displayStatus === "paid") {
    return {
      label: "Settled",
      tone: "text-emerald-600",
    };
  }

  if (displayStatus === "cancelled") {
    return {
      label: "Closed",
      tone: "text-slate-500",
    };
  }

  if (displayStatus === "overdue") {
    return {
      label: "Overdue",
      tone: "text-rose-600",
    };
  }

  const dueAt = new Date(invoice.due_at).getTime();
  const now = Date.now();
  const threeDays = 3 * 24 * 60 * 60 * 1000;

  if (dueAt - now <= threeDays) {
    return {
      label: "Due soon",
      tone: "text-amber-600",
    };
  }

  return {
    label: "Upcoming",
    tone: "text-emerald-600",
  };
}

export function InvoiceList({
  emptyMessage,
  invoices,
  showLeadLink = true,
  showStatusActions = true,
}: InvoiceListProps) {
  if (invoices.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {invoices.map((invoice) => {
        const displayStatus = getInvoiceDisplayStatus(invoice);
        const dueTone = getDueTone(invoice);

        return (
          <li
            className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4"
            key={invoice.id}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {showLeadLink && invoice.lead ? (
                      <Link
                        className="text-sm font-semibold text-slate-950 hover:text-sky-700"
                        href={`/leads/${invoice.lead.id}`}
                      >
                        {invoice.lead.full_name}
                      </Link>
                    ) : (
                      <p className="text-sm font-semibold text-slate-950">
                        {invoice.invoice_number}
                      </p>
                    )}
                    <Badge variant="default">{invoice.invoice_number}</Badge>
                  </div>
                  <p className="text-sm text-slate-600">
                    {invoice.note || "No additional billing note recorded for this invoice."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <InvoiceStatusBadge status={displayStatus} />
                  <Badge variant="info">{formatCurrencyFromCents(invoice.amount_cents)}</Badge>
                  {invoice.lead?.source ? <Badge variant="default">{invoice.lead.source}</Badge> : null}
                  {invoice.send_requested_at && !invoice.email_sent_at ? (
                    <Badge variant="warning">Queued to send</Badge>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  {invoice.external_payment_link ? (
                    <a
                      href={invoice.external_payment_link}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <Button size="sm" variant="outline">
                        Payment link
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  ) : null}
                  {invoice.lead?.email ? (
                    <a href={`mailto:${invoice.lead.email}`}>
                      <Button size="sm" variant="outline">
                        Email lead
                        <Mail className="h-4 w-4" />
                      </Button>
                    </a>
                  ) : null}
                </div>

                {showStatusActions ? (
                  <InvoiceStatusForm
                    currentStatus={displayStatus}
                    invoiceId={invoice.id}
                    leadId={invoice.lead_id}
                  />
                ) : null}
              </div>

              <div className="space-y-1 text-right">
                <p className="text-sm font-medium text-slate-950">
                  Due {formatDate(invoice.due_at)}
                </p>
                <p className={`text-sm ${dueTone.tone}`}>{dueTone.label}</p>
                <p className="text-xs text-slate-500">
                  Created {formatDateTime(invoice.created_at)}
                </p>
                {invoice.email_sent_at ? (
                  <p className="text-xs text-slate-500">
                    Sent {formatDateTime(invoice.email_sent_at)}
                  </p>
                ) : null}
                {invoice.last_reminder_sent_at ? (
                  <p className="text-xs text-slate-500">
                    Reminder {formatDateTime(invoice.last_reminder_sent_at)}
                  </p>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
