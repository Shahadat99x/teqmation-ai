import Link from "next/link";
import { ArrowRight, Globe2, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { env } from "@/lib/env";
import { getLeadDashboardOverview } from "@/lib/intake/server";
import { cn, formatDateTime } from "@/lib/utils";

const metricCards = [
  {
    key: "total",
    label: "Total leads",
    variant: "success" as const,
  },
  {
    key: "manual",
    label: "Manual entries",
    variant: "default" as const,
  },
  {
    key: "public",
    label: "Public inquiries",
    variant: "info" as const,
  },
  {
    key: "week",
    label: "Created this week",
    variant: "warning" as const,
  },
];

export default async function DashboardPage() {
  const overview = await getLeadDashboardOverview();
  const publicInquiryHref = `/inquiry/${overview.workspace.workspaceSlug}`;
  const publicInquiryUrl = `${env.NEXT_PUBLIC_APP_URL}${publicInquiryHref}`;

  const metricValues = {
    total: overview.totalLeads,
    manual: overview.manualLeadCount,
    public: overview.publicInquiryCount,
    week: overview.newThisWeekCount,
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(120deg,#ffffff_0%,#f0f7ff_54%,#dbeafe_100%)] p-6 shadow-[0_32px_80px_-52px_rgba(14,116,144,0.4)] sm:p-8">
        <div className="absolute -right-24 top-0 h-64 w-64 rounded-full bg-sky-200/35 blur-3xl" />
        <div className="relative grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <Badge className="w-fit" variant="info">
              Phase 03 live
            </Badge>
            <div className="space-y-3">
              <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Smart Intake is now the first real workflow in the product.
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                {overview.workspace.workspaceName} can now capture leads from inside
                the dashboard and from a public inquiry form, with source tracking,
                default stage assignment, and the first activity log entry.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                className={cn(buttonVariants({ size: "lg" }), "rounded-2xl")}
                href="/leads/new"
              >
                <Plus className="h-4 w-4" />
                Add lead
              </Link>
              <Link
                className={cn(
                  buttonVariants({ variant: "secondary", size: "lg" }),
                  "rounded-2xl",
                )}
                href={publicInquiryHref}
                target="_blank"
              >
                <Globe2 className="h-4 w-4" />
                Open public inquiry form
              </Link>
            </div>
          </div>

          <Card className="rounded-[28px] border-sky-100 bg-slate-950 text-white">
            <CardHeader>
              <CardTitle className="text-white">Current workspace intake link</CardTitle>
              <CardDescription className="text-slate-300">
                Share this route publicly when you want inquiries to land directly
                inside the workspace lead list.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                {publicInquiryUrl}
              </div>
              <p className="text-sm leading-6 text-slate-300">
                Public submissions use the source <span className="font-medium text-white">Public Inquiry</span> and
                start in the <span className="font-medium text-white">New Lead</span> stage.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
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

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Recent leads</CardTitle>
            <CardDescription>
              The newest records created through the dashboard or public inquiry flow.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {overview.recentLeads.length > 0 ? (
              <ul className="space-y-3">
                {overview.recentLeads.map((lead) => (
                  <li
                    className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4"
                    key={lead.id}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-2">
                        <Link
                          className="text-sm font-semibold text-slate-950 hover:text-sky-700"
                          href={`/leads/${lead.id}`}
                        >
                          {lead.full_name}
                        </Link>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={lead.source === "Public Inquiry" ? "info" : "default"}>
                            {lead.source}
                          </Badge>
                          <Badge variant="warning">
                            {lead.current_stage?.name ?? "New Lead"}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-slate-500">
                        {formatDateTime(lead.created_at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                No leads yet. Start with a manual entry or a public inquiry.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Phase 03 boundary</CardTitle>
            <CardDescription>
              Intake is live, but later workflow modules still stay out of scope here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm leading-6 text-slate-600">
              <li className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                No follow-up scheduling yet
              </li>
              <li className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                No stage automation or pipeline movement
              </li>
              <li className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                No documents, invoices, or AI workflows
              </li>
              <li className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                No analytics beyond operational intake visibility
              </li>
            </ul>
            <Link
              className={cn(
                buttonVariants({ variant: "secondary" }),
                "mt-5 inline-flex rounded-2xl",
              )}
              href="/leads"
            >
              Go to leads
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
