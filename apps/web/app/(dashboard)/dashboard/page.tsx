import Link from "next/link";
import { ArrowRight, BellRing, GitBranch, Globe2, Plus } from "lucide-react";

import { FollowUpStatusBadge } from "@/components/follow-ups/follow-up-status-badge";
import { StageBadge } from "@/components/stages/stage-badge";
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
import { getFollowUpDashboardOverview } from "@/lib/follow-ups/server";
import { getLeadDashboardOverview } from "@/lib/intake/server";
import { getStageDashboardOverview } from "@/lib/stages/server";
import { cn, formatDateTime } from "@/lib/utils";

const metricCards = [
  {
    key: "total",
    label: "Total leads",
    variant: "success" as const,
  },
  {
    key: "open",
    label: "Open follow-ups",
    variant: "info" as const,
  },
  {
    key: "today",
    label: "Due today",
    variant: "default" as const,
  },
  {
    key: "overdue",
    label: "Overdue",
    variant: "warning" as const,
  },
];

export default async function DashboardPage() {
  const [leadOverview, followUpOverview, stageOverview] = await Promise.all([
    getLeadDashboardOverview(),
    getFollowUpDashboardOverview(),
    getStageDashboardOverview(),
  ]);
  const publicInquiryHref = `/inquiry/${leadOverview.workspace.workspaceSlug}`;
  const publicInquiryUrl = `${env.NEXT_PUBLIC_APP_URL}${publicInquiryHref}`;

  const metricValues = {
    total: leadOverview.totalLeads,
    open: followUpOverview.openCount,
    today: followUpOverview.dueTodayCount,
    overdue: followUpOverview.overdueCount,
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(120deg,#ffffff_0%,#f0f7ff_54%,#dbeafe_100%)] p-6 shadow-[0_32px_80px_-52px_rgba(14,116,144,0.4)] sm:p-8">
        <div className="absolute -right-24 top-0 h-64 w-64 rounded-full bg-sky-200/35 blur-3xl" />
        <div className="relative grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <Badge className="w-fit" variant="info">
              Phase 05 live
            </Badge>
            <div className="space-y-3">
              <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Pipeline progress is now visible across the workspace.
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                {leadOverview.workspace.workspaceName} can now capture leads, track reminders, and move each lead through a structured stage pipeline with change history.
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
              <Link
                className={cn(
                  buttonVariants({ variant: "ghost", size: "lg" }),
                  "rounded-2xl",
                )}
                href="/pipeline"
              >
                <GitBranch className="h-4 w-4" />
                Open pipeline
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
                Public submissions use the source{" "}
                <span className="font-medium text-white">Public Inquiry</span>,
                start in the <span className="font-medium text-white">New Lead</span>{" "}
                stage, and can now move through the full pipeline intentionally.
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

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Pipeline snapshot</CardTitle>
            <CardDescription>
              Current stage counts across the default V1 pipeline.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {stageOverview.stageSummaries.map((summary) => (
              <div
                className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4"
                key={summary.stage.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <StageBadge stageName={summary.stage.name} />
                  <span className="text-sm font-semibold text-slate-950">{summary.count}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent stage changes</CardTitle>
            <CardDescription>
              The latest lead movement through the pipeline.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stageOverview.recentStageChanges.length > 0 ? (
              <ul className="space-y-3">
                {stageOverview.recentStageChanges.map((entry) => (
                  <li
                    className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4"
                    key={entry.id}
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {entry.from_stage ? <StageBadge stageName={entry.from_stage.name} /> : null}
                        <span className="text-sm text-slate-400">→</span>
                        <StageBadge stageName={entry.to_stage.name} />
                      </div>
                      <p className="text-sm text-slate-500">
                        {formatDateTime(entry.changed_at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                No stage changes recorded yet.
              </div>
            )}
            <Link
              className={cn(
                buttonVariants({ variant: "secondary" }),
                "mt-5 inline-flex rounded-2xl",
              )}
              href="/pipeline"
            >
              Go to pipeline
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Due follow-ups</CardTitle>
            <CardDescription>
              Open reminder work that is currently due or overdue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {followUpOverview.dueFollowUps.length > 0 ? (
              <ul className="space-y-3">
                {followUpOverview.dueFollowUps.map((followUp) => (
                  <li
                    className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4"
                    key={followUp.id}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-2">
                        <Link
                          className="text-sm font-semibold text-slate-950 hover:text-sky-700"
                          href={`/leads/${followUp.lead_id}`}
                        >
                          {followUp.lead?.full_name ?? "Lead record"}
                        </Link>
                        <div className="flex flex-wrap gap-2">
                          <FollowUpStatusBadge status={followUp.status} />
                          <Badge variant={followUp.channel === "email" ? "info" : "default"}>
                            {followUp.channel}
                          </Badge>
                          {followUp.lead?.source ? (
                            <Badge
                              variant={
                                followUp.lead.source === "Public Inquiry" ? "info" : "default"
                              }
                            >
                              {followUp.lead.source}
                            </Badge>
                          ) : null}
                          <Badge
                            variant={
                              new Date(followUp.due_at).getTime() < Date.now()
                                ? "warning"
                                : "success"
                            }
                          >
                            {new Date(followUp.due_at).getTime() < Date.now()
                              ? "Overdue"
                              : "Due today"}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-slate-500">
                        {formatDateTime(followUp.due_at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                No due follow-ups right now. Schedule reminders from a lead detail page.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent leads</CardTitle>
            <CardDescription>
              The newest records created through the dashboard or public inquiry flow.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {leadOverview.recentLeads.length > 0 ? (
              <ul className="space-y-3">
                {leadOverview.recentLeads.map((lead) => (
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
            <Link
              className={cn(
                buttonVariants({ variant: "secondary" }),
                "mt-5 inline-flex rounded-2xl",
              )}
              href="/follow-ups"
            >
              Go to follow-ups
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
