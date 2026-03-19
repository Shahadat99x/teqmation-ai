import Link from "next/link";

import { StageBadge } from "@/components/stages/stage-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LeadRecord } from "@/lib/intake/types";
import { formatDate, formatDateTime } from "@/lib/utils";

type LeadsTableProps = {
  leads: LeadRecord[];
};

function SourceBadge({ source }: { source: string }) {
  return (
    <Badge variant={source === "Public Inquiry" ? "info" : "default"}>{source}</Badge>
  );
}

export function LeadsTable({ leads }: LeadsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lead records</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="pb-3 pr-4 font-medium">Lead</th>
                <th className="pb-3 pr-4 font-medium">Source</th>
                <th className="pb-3 pr-4 font-medium">Stage</th>
                <th className="pb-3 pr-4 font-medium">Destination</th>
                <th className="pb-3 pr-4 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td className="py-4 pr-4">
                    <div className="space-y-1">
                      <Link
                        className="font-semibold text-slate-950 hover:text-sky-700"
                        href={`/leads/${lead.id}`}
                      >
                        {lead.full_name}
                      </Link>
                      <p className="text-slate-500">
                        {lead.email || lead.phone || "No contact details"}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 pr-4">
                    <SourceBadge source={lead.source} />
                  </td>
                  <td className="py-4 pr-4">
                    <StageBadge stageName={lead.current_stage?.name ?? "New Lead"} />
                  </td>
                  <td className="py-4 pr-4 text-slate-600">
                    {lead.desired_destination || lead.country || "Not set"}
                  </td>
                  <td className="py-4 pr-4 text-slate-600">
                    {formatDateTime(lead.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 lg:hidden">
          {leads.map((lead) => (
            <Link
              className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4"
              href={`/leads/${lead.id}`}
              key={lead.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <p className="font-semibold text-slate-950">{lead.full_name}</p>
                  <p className="text-sm text-slate-500">
                    {lead.email || lead.phone || "No contact details"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <SourceBadge source={lead.source} />
                    <StageBadge stageName={lead.current_stage?.name ?? "New Lead"} />
                  </div>
                </div>
                <p className="text-sm text-slate-500">{formatDate(lead.created_at)}</p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
