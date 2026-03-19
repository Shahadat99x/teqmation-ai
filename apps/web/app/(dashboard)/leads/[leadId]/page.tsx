import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getLeadDetail } from "@/lib/intake/server";
import { cn, formatDateTime } from "@/lib/utils";

type LeadDetailPageProps = {
  params: Promise<{
    leadId: string;
  }>;
};

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const { leadId } = await params;
  const { lead, activities } = await getLeadDetail(leadId);

  if (!lead) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Badge className="w-fit" variant="info">
            Lead detail
          </Badge>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            {lead.full_name}
          </h2>
          <p className="text-sm text-slate-500">
            Created {formatDateTime(lead.created_at)}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Badge variant="default">{lead.source}</Badge>
          <Badge variant="warning">{lead.current_stage?.name ?? "New Lead"}</Badge>
          <Link
            className={cn(buttonVariants({ variant: "secondary" }), "rounded-2xl")}
            href="/leads"
          >
            Back to leads
          </Link>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Lead profile</CardTitle>
            <CardDescription>
              This is the first CRM record foundation for the lead. Editing and
              deeper workflows will come in later phases.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Email</p>
              <p className="mt-2 text-sm font-medium text-slate-950">
                {lead.email || "Not provided"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Phone</p>
              <p className="mt-2 text-sm font-medium text-slate-950">
                {lead.phone || "Not provided"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Country</p>
              <p className="mt-2 text-sm font-medium text-slate-950">
                {lead.country || "Not provided"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                Desired destination
              </p>
              <p className="mt-2 text-sm font-medium text-slate-950">
                {lead.desired_destination || "Not provided"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Intake term</p>
              <p className="mt-2 text-sm font-medium text-slate-950">
                {lead.intake_term || "Not provided"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                Current stage
              </p>
              <p className="mt-2 text-sm font-medium text-slate-950">
                {lead.current_stage?.name ?? "New Lead"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Message</p>
              <p className="mt-2 text-sm leading-7 text-slate-700">
                {lead.message || "No message or notes were provided for this lead yet."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity log</CardTitle>
            <CardDescription>
              Smart Intake starts the operational timeline with lead creation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activities.length > 0 ? (
              <ul className="space-y-3">
                {activities.map((activity) => (
                  <li
                    className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4"
                    key={activity.id}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-950">
                          {activity.title}
                        </p>
                        <p className="text-sm leading-6 text-slate-600">
                          {activity.description || "No extra details recorded."}
                        </p>
                      </div>
                      <p className="whitespace-nowrap text-xs text-slate-500">
                        {formatDateTime(activity.created_at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                No activities recorded yet.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
