import Link from "next/link";
import { ExternalLink, GitBranch, Search } from "lucide-react";

import { LeadsTable } from "@/components/leads/leads-table";
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
import { Input } from "@/components/ui/input";
import { listLeads } from "@/lib/intake/server";
import { cn } from "@/lib/utils";

type LeadsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const params = await searchParams;
  const searchQuery = getQueryValue(params.q) ?? "";
  const { workspace, leads } = await listLeads(searchQuery);
  const publicInquiryHref = `/inquiry/${workspace.workspaceSlug}`;
  const publicInquiryUrl = `${env.NEXT_PUBLIC_APP_URL}${publicInquiryHref}`;

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden bg-[linear-gradient(135deg,#ffffff_0%,#f3f8ff_56%,#dbeafe_100%)]">
          <CardHeader className="space-y-4">
            <Badge className="w-fit" variant="info">
              Smart Intake
            </Badge>
            <div className="space-y-2">
              <CardTitle className="text-3xl">Lead intake workspace</CardTitle>
              <CardDescription className="max-w-2xl text-base leading-7">
                Create leads manually, accept public inquiries, and start the first
                CRM record with a default stage and activity history.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                className={cn(buttonVariants({ size: "lg" }), "rounded-2xl")}
                href="/leads/new"
              >
                Add lead
              </Link>
              <Link
                className={cn(
                  buttonVariants({ size: "lg", variant: "secondary" }),
                  "rounded-2xl",
                )}
                href={publicInquiryHref}
                target="_blank"
              >
                Open public inquiry form
                <ExternalLink className="h-4 w-4" />
              </Link>
              <Link
                className={cn(buttonVariants({ size: "lg", variant: "ghost" }), "rounded-2xl")}
                href="/pipeline"
              >
                Open pipeline
                <GitBranch className="h-4 w-4" />
              </Link>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <Badge className="w-fit" variant="success">
              Workspace link
            </Badge>
            <CardTitle>Public inquiry URL</CardTitle>
            <CardDescription>
              Share this route externally to capture public form submissions into{" "}
              {workspace.workspaceName}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {publicInquiryUrl}
            </div>
            <p className="text-sm leading-6 text-slate-500">
              Public submissions automatically store the source as{" "}
              <span className="font-medium text-slate-700">Public Inquiry</span> and
              create the initial activity log entry.
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Leads</CardTitle>
            <CardDescription>
              {leads.length > 0
                ? `${leads.length} lead${leads.length === 1 ? "" : "s"} in this workspace.`
                : "No leads yet. Create the first one from the dashboard or public form."}
            </CardDescription>
          </div>

          <form className="flex w-full max-w-md items-center gap-3" method="get">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="pl-10"
                defaultValue={searchQuery}
                name="q"
                placeholder="Search name, email, phone, or source"
              />
            </div>
            <button className={cn(buttonVariants({ variant: "secondary" }))} type="submit">
              Search
            </button>
          </form>
        </CardHeader>
      </Card>

      {leads.length > 0 ? (
        <LeadsTable leads={leads} />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-start gap-4 p-8">
            <Badge variant="warning">Empty state</Badge>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-slate-950">
                No leads have been captured yet
              </h2>
              <p className="max-w-xl text-sm leading-7 text-slate-500">
                The Smart Intake flow is ready, but this workspace does not have any
                leads yet. Start with a manual entry or share the public inquiry form.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                className={cn(buttonVariants({ size: "lg" }), "rounded-2xl")}
                href="/leads/new"
              >
                Create the first lead
              </Link>
              <Link
                className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}
                href={publicInquiryHref}
                target="_blank"
              >
                Open public inquiry form
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
