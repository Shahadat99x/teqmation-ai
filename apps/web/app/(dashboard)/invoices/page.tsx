import Link from "next/link";
import { ArrowRight, ReceiptText } from "lucide-react";

import { InvoiceList } from "@/components/invoices/invoice-list";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listInvoices } from "@/lib/invoices/server";
import { cn } from "@/lib/utils";

const metricCards = [
  {
    key: "openCount",
    label: "Open invoices",
    variant: "info" as const,
  },
  {
    key: "overdueCount",
    label: "Overdue",
    variant: "warning" as const,
  },
  {
    key: "paidCount",
    label: "Paid",
    variant: "success" as const,
  },
];

export default async function InvoicesPage() {
  const overview = await listInvoices();
  const metricValues = {
    openCount: overview.openCount,
    overdueCount: overview.overdueCount,
    paidCount: overview.paidCount,
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_50%,#dbeafe_100%)]">
        <CardHeader className="space-y-4">
          <Badge className="w-fit" variant="info">
            Phase 07 live
          </Badge>
          <div className="space-y-2">
            <CardTitle className="text-3xl">Billing flow</CardTitle>
            <CardDescription className="max-w-2xl text-base leading-7">
              Create invoices from lead records, track due dates and payment status, and keep overdue billing work visible without turning ClientFlow AI into a full accounting system.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-600">
              <ReceiptText className="h-4 w-4 text-sky-600" />
              {overview.workspace.workspaceName} billing workspace
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
            <CardTitle>Invoices</CardTitle>
            <CardDescription>
              Lead-linked billing records with manual status control and optional external payment links.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InvoiceList
              emptyMessage="No invoices have been created yet. Start from a lead detail page."
              invoices={overview.invoices}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing status snapshot</CardTitle>
            <CardDescription>
              Current invoice mix across the workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Draft</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{overview.draftCount}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Sent / viewed</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {overview.sentCount + overview.viewedCount}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Cancelled</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {overview.cancelledCount}
              </p>
            </div>
            <Link
              className={cn(
                buttonVariants({ variant: "secondary" }),
                "inline-flex rounded-2xl",
              )}
              href="/dashboard"
            >
              Return to dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
