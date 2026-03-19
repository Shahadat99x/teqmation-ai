import Link from "next/link";
import { BellRing } from "lucide-react";

import { FollowUpList } from "@/components/follow-ups/follow-up-list";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listFollowUps } from "@/lib/follow-ups/server";
import { cn } from "@/lib/utils";

const metricConfig = [
  {
    key: "openCount",
    label: "Open reminders",
    variant: "info" as const,
  },
  {
    key: "overdueCount",
    label: "Overdue",
    variant: "warning" as const,
  },
  {
    key: "pendingCount",
    label: "Pending",
    variant: "default" as const,
  },
  {
    key: "sentCount",
    label: "Sent",
    variant: "success" as const,
  },
];

export default async function FollowUpsPage() {
  const overview = await listFollowUps();
  const metricValues = {
    openCount: overview.openCount,
    overdueCount: overview.overdueCount,
    pendingCount: overview.pendingCount,
    sentCount: overview.sentCount,
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden bg-[linear-gradient(135deg,#ffffff_0%,#f7fbff_45%,#dbeafe_100%)]">
        <CardHeader className="space-y-4">
          <Badge className="w-fit" variant="info">
            Phase 04 live
          </Badge>
          <div className="space-y-2">
            <CardTitle className="text-3xl">Follow-up workspace</CardTitle>
            <CardDescription className="max-w-2xl text-base leading-7">
              Track due reminders, mark completed outreach, and keep day-to-day
              follow-up work visible instead of buried in notes.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className={cn(buttonVariants({ size: "lg" }), "rounded-2xl")}
              href="/leads"
            >
              Go to leads
            </Link>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-600">
              <BellRing className="h-4 w-4 text-sky-600" />
              {overview.workspace.workspaceName} reminder queue
            </div>
          </div>
        </CardHeader>
      </Card>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {metricConfig.map((card) => (
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
            <CardTitle>Reminder queue</CardTitle>
            <CardDescription>
              Open reminders appear here with status controls so the team can keep
              communication work current.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FollowUpList
              emptyMessage="No follow-ups have been scheduled yet. Add one from a lead detail page."
              followUps={overview.followUps}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Phase 04 boundary</CardTitle>
            <CardDescription>
              Reminder scheduling is now live, but communication automation stays intentionally narrow here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm leading-6 text-slate-600">
              <li className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                Email and internal reminders only
              </li>
              <li className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                No inbox sync, WhatsApp, SMS, or social messaging
              </li>
              <li className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                No stage automation, documents, invoices, or AI sending
              </li>
              <li className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                n8n is only handling timing and summary workflow scaffolding
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
