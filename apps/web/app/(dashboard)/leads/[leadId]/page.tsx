import Link from "next/link";
import { notFound } from "next/navigation";

import { FollowUpForm } from "@/components/follow-ups/follow-up-form";
import { FollowUpList } from "@/components/follow-ups/follow-up-list";
import { DocumentRequestChecklist } from "@/components/documents/document-request-checklist";
import { DocumentRequestForm } from "@/components/documents/document-request-form";
import { UploadedDocumentsList } from "@/components/documents/uploaded-documents-list";
import { StageBadge } from "@/components/stages/stage-badge";
import { StageHistoryList } from "@/components/stages/stage-history-list";
import { StageSelectorForm } from "@/components/stages/stage-selector-form";
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
import { getLeadDocumentHub } from "@/lib/documents/server";
import { buildDocumentRequestFormState } from "@/lib/documents/validation";
import { getLeadFollowUps } from "@/lib/follow-ups/server";
import { buildFollowUpFormState } from "@/lib/follow-ups/validation";
import { getLeadDetail } from "@/lib/intake/server";
import { getLeadStageHistory, listPipelineStages } from "@/lib/stages/server";
import { buildStageChangeFormState } from "@/lib/stages/validation";
import { cn, formatDateTime } from "@/lib/utils";

type LeadDetailPageProps = {
  params: Promise<{
    leadId: string;
  }>;
};

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const { leadId } = await params;
  const [{ lead, activities }, followUps, stageHistory, stages, documentHub] = await Promise.all([
    getLeadDetail(leadId),
    getLeadFollowUps(leadId),
    getLeadStageHistory(leadId),
    listPipelineStages(),
    getLeadDocumentHub(leadId),
  ]);

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
          <StageBadge stageName={lead.current_stage?.name ?? "New Lead"} />
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
              <div className="mt-2">
                <StageBadge stageName={lead.current_stage?.name ?? "New Lead"} />
              </div>
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
            <CardTitle>Stage workflow</CardTitle>
            <CardDescription>
              Stage movement stays user-controlled, logged, and ready for later automation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Current stage</p>
              <div className="mt-3">
                <StageBadge stageName={lead.current_stage?.name ?? "New Lead"} />
              </div>
            </div>

            <StageSelectorForm
              currentStageId={lead.current_stage?.id ?? ""}
              initialState={buildStageChangeFormState(lead.current_stage?.id ?? "")}
              leadId={lead.id}
              stages={stages}
            />

            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-950">Stage history</h3>
                <p className="text-sm text-slate-500">
                  Every stage movement is recorded as the starting pipeline timeline.
                </p>
              </div>
              <StageHistoryList history={stageHistory} />
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Schedule follow-up</CardTitle>
            <CardDescription>
              Add the next reminder directly from the lead record so communication
              work stays visible in the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FollowUpForm initialState={buildFollowUpFormState()} leadId={lead.id} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Follow-ups</CardTitle>
            <CardDescription>
              Open and completed reminders tied to this lead.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FollowUpList
              emptyMessage="No reminders have been scheduled for this lead yet."
              followUps={followUps}
              showLeadLink={false}
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Request documents</CardTitle>
            <CardDescription>
              Create a checklist and secure upload link for this lead.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <DocumentRequestForm
              initialState={buildDocumentRequestFormState()}
              leadId={lead.id}
            />
            {documentHub.activeUploadLink ? (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Current upload link
                </p>
                <p className="mt-2 break-all text-sm text-slate-700">
                  {`${env.NEXT_PUBLIC_APP_URL}/upload/${documentHub.activeUploadLink.token}`}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Expires {formatDateTime(documentHub.activeUploadLink.expires_at)}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Document checklist</CardTitle>
            <CardDescription>
              Requested items, uploaded status, and the private file history for this lead.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-950">Requested items</h3>
              <DocumentRequestChecklist
                emptyMessage="No document requests have been created for this lead yet."
                requests={documentHub.requests}
              />
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-950">Uploaded files</h3>
              <UploadedDocumentsList
                emptyMessage="No files have been uploaded for this lead yet."
                uploads={documentHub.uploads}
              />
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Activity log</CardTitle>
          <CardDescription>
            Lead creation, stage changes, and follow-up actions all appear here.
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
    </div>
  );
}
