import Link from "next/link";
import { notFound } from "next/navigation";

import { PublicInquiryForm } from "@/components/leads/public-inquiry-form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPublicWorkspaceBySlug } from "@/lib/intake/server";
import { buildLeadFormState } from "@/lib/intake/validation";

type PublicInquiryPageProps = {
  params: Promise<{
    workspaceSlug: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PublicInquiryPage({
  params,
  searchParams,
}: PublicInquiryPageProps) {
  const { workspaceSlug } = await params;
  const workspace = await getPublicWorkspaceBySlug(workspaceSlug);

  if (!workspace) {
    notFound();
  }

  const query = await searchParams;
  const submitted = getQueryValue(query.submitted) === "1";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.22),transparent_35%),linear-gradient(180deg,#eff6ff_0%,#f8fafc_28%,#eef3f9_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative overflow-hidden rounded-[36px] bg-[linear-gradient(160deg,#0f172a_0%,#1e293b_52%,#0f766e_100%)] p-8 text-white shadow-[0_40px_120px_-48px_rgba(15,23,42,0.8)] sm:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(125,211,252,0.26),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(45,212,191,0.18),transparent_28%)]" />
          <div className="relative flex h-full flex-col justify-between gap-12">
            <div className="space-y-8">
              <div className="space-y-5">
                <Badge className="w-fit bg-white/12 text-slate-100" variant="default">
                  Public inquiry
                </Badge>
                <div className="space-y-3">
                  <h1 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
                    Start your inquiry with {workspace.workspaceName}.
                  </h1>
                  <p className="max-w-xl text-base leading-8 text-slate-200">
                    This form creates a lead record directly in the ClientFlow AI
                    workspace so the consultancy team can review it from the dashboard.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/15 bg-white/8 p-4">
                  <p className="text-sm font-semibold">Captured in one place</p>
                  <p className="mt-1 text-sm text-slate-300">
                    Your inquiry becomes a lead record in the team dashboard.
                  </p>
                </div>
                <div className="rounded-3xl border border-white/15 bg-white/8 p-4">
                  <p className="text-sm font-semibold">Source tracked</p>
                  <p className="mt-1 text-sm text-slate-300">
                    Public submissions are marked as Public Inquiry automatically.
                  </p>
                </div>
                <div className="rounded-3xl border border-white/15 bg-white/8 p-4">
                  <p className="text-sm font-semibold">Operational start point</p>
                  <p className="mt-1 text-sm text-slate-300">
                    Each inquiry starts in the default New Lead stage.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/12 bg-black/10 p-5">
              <p className="text-sm text-slate-200">
                This phase focuses only on intake. Follow-up, documents, invoices,
                and AI features come later.
              </p>
            </div>
          </div>
        </section>

        <section className="flex items-center">
          <Card className="w-full rounded-[32px]">
            <CardHeader className="space-y-4 p-8 pb-0">
              <Badge className="w-fit" variant="info">
                Inquiry form
              </Badge>
              <div className="space-y-2">
                <CardTitle className="text-3xl">Tell us about your plans</CardTitle>
                <CardDescription className="text-base leading-7">
                  Share your contact details and study goals. The team will review
                  your inquiry from the protected dashboard workspace.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              {submitted ? (
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-7 text-emerald-800">
                  <p className="font-semibold">Inquiry received</p>
                  <p className="mt-2">
                    Your information has been submitted successfully. The consultancy
                    team can now review it inside ClientFlow AI.
                  </p>
                </div>
              ) : null}

              <PublicInquiryForm
                initialState={buildLeadFormState({ source: "Public Inquiry" })}
                workspaceSlug={workspace.workspaceSlug}
              />

              <p className="text-sm leading-6 text-slate-500">
                This form submits into a protected internal workspace. No payment,
                document upload, or messaging automation happens here yet.
              </p>
              <Link className="text-sm font-medium text-sky-700" href="/">
                Back to ClientFlow AI
              </Link>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
