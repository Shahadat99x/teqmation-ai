import Link from "next/link";
import { ArrowRight, GitBranch } from "lucide-react";

import { PipelineStageGroupCard } from "@/components/stages/pipeline-stage-group";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPipelineOverview } from "@/lib/stages/server";
import { cn } from "@/lib/utils";

export default async function PipelinePage() {
  const overview = await getPipelineOverview();

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_52%,#dbeafe_100%)]">
        <CardHeader className="space-y-4">
          <Badge className="w-fit" variant="info">
            Phase 05 live
          </Badge>
          <div className="space-y-2">
            <CardTitle className="text-3xl">Pipeline view</CardTitle>
            <CardDescription className="max-w-2xl text-base leading-7">
              See every lead grouped by stage so the consultancy can understand where work is moving and what needs the next action.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-600">
              <GitBranch className="h-4 w-4 text-sky-600" />
              {overview.totalLeads} leads across {overview.groups.length} stages
            </div>
            <Link
              className={cn(buttonVariants({ variant: "secondary" }), "rounded-2xl")}
              href="/leads"
            >
              Open leads
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </CardHeader>
      </Card>

      <section className="grid gap-6 xl:grid-cols-3">
        {overview.groups.map((group) => (
          <PipelineStageGroupCard group={group} key={group.stage.id} />
        ))}
      </section>
    </div>
  );
}
