import Link from "next/link";
import { notFound } from "next/navigation";

import { DocumentRequestChecklist } from "@/components/documents/document-request-checklist";
import { PublicDocumentUploadForm } from "@/components/documents/public-document-upload-form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPublicUploadContext } from "@/lib/documents/server";
import { buildPublicDocumentUploadFormState } from "@/lib/documents/validation";

type PublicUploadPageProps = {
  params: Promise<{
    token: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PublicUploadPage({
  params,
  searchParams,
}: PublicUploadPageProps) {
  const { token } = await params;
  const context = await getPublicUploadContext(token);

  if (!context) {
    notFound();
  }

  const query = await searchParams;
  const uploaded = getQueryValue(query.uploaded) === "1";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_35%),linear-gradient(180deg,#eff6ff_0%,#f8fafc_28%,#eef3f9_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-6 lg:grid-cols-[1.02fr_0.98fr]">
        <section className="relative overflow-hidden rounded-[36px] bg-[linear-gradient(160deg,#0f172a_0%,#1e293b_52%,#0f766e_100%)] p-8 text-white shadow-[0_40px_120px_-48px_rgba(15,23,42,0.8)] sm:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(125,211,252,0.26),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(45,212,191,0.18),transparent_28%)]" />
          <div className="relative flex h-full flex-col justify-between gap-10">
            <div className="space-y-8">
              <div className="space-y-5">
                <Badge className="w-fit bg-white/12 text-slate-100" variant="default">
                  Secure document upload
                </Badge>
                <div className="space-y-3">
                  <h1 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
                    Upload requested documents for {context.lead.fullName}.
                  </h1>
                  <p className="max-w-xl text-base leading-8 text-slate-200">
                    This secure link lets you submit private files directly into ClientFlow AI so the consultancy can review them from the protected dashboard.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/15 bg-white/8 p-4">
                  <p className="text-sm font-semibold">Private storage</p>
                  <p className="mt-1 text-sm text-slate-300">
                    Files are stored in private Supabase Storage, not public media tooling.
                  </p>
                </div>
                <div className="rounded-3xl border border-white/15 bg-white/8 p-4">
                  <p className="text-sm font-semibold">Checklist aware</p>
                  <p className="mt-1 text-sm text-slate-300">
                    You can upload directly against a requested document item.
                  </p>
                </div>
                <div className="rounded-3xl border border-white/15 bg-white/8 p-4">
                  <p className="text-sm font-semibold">Email-first flow</p>
                  <p className="mt-1 text-sm text-slate-300">
                    This page is the upload endpoint used by document request emails.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/12 bg-black/10 p-5">
              <p className="text-sm leading-7 text-slate-200">
                Link expires on {new Date(context.uploadLink.expires_at).toLocaleDateString("en", { dateStyle: "medium" })}.
                Only upload the requested files here.
              </p>
            </div>
          </div>
        </section>

        <section className="flex items-center">
          <Card className="w-full rounded-[32px]">
            <CardHeader className="space-y-4 p-8 pb-0">
              <Badge className="w-fit" variant="info">
                Upload page
              </Badge>
              <div className="space-y-2">
                <CardTitle className="text-3xl">Send the requested files</CardTitle>
                <CardDescription className="text-base leading-7">
                  Upload one file at a time. Requested items and upload history will be tracked in the consultancy dashboard.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              {uploaded ? (
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-7 text-emerald-800">
                  <p className="font-semibold">Upload received</p>
                  <p className="mt-2">
                    Your file was uploaded successfully. The consultancy team can now review it from ClientFlow AI.
                  </p>
                </div>
              ) : null}

              <div className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Requested checklist
                </h2>
                <DocumentRequestChecklist
                  emptyMessage="No checklist items are attached to this upload link."
                  requests={context.requests}
                />
              </div>

              <PublicDocumentUploadForm
                initialState={buildPublicDocumentUploadFormState()}
                requests={context.requests}
                token={token}
              />

              <p className="text-sm leading-6 text-slate-500">
                This page only handles file uploads. It does not expose any private dashboard data, billing, or messaging tools.
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
