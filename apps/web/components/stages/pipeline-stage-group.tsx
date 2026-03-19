import Link from "next/link";

import { StageBadge } from "@/components/stages/stage-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PipelineStageGroup } from "@/lib/stages/types";
import { formatDate } from "@/lib/utils";

export function PipelineStageGroupCard({ group }: { group: PipelineStageGroup }) {
  return (
    <Card className="h-full">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StageBadge stageName={group.stage.name} />
          <Badge variant="default">{group.leadCount}</Badge>
        </div>
        <CardTitle>{group.stage.name}</CardTitle>
      </CardHeader>
      <CardContent>
        {group.leads.length > 0 ? (
          <ul className="space-y-3">
            {group.leads.map((lead) => (
              <li
                className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4"
                key={lead.id}
              >
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
                    <Badge variant="default">
                      {lead.desired_destination || lead.country || "No destination"}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500">
                    {lead.email || lead.phone || "No contact details"}
                  </p>
                  <p className="text-xs text-slate-500">Created {formatDate(lead.created_at)}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
            No leads are in this stage yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
