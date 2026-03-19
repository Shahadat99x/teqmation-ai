import Link from "next/link";

import { ManualLeadForm } from "@/components/leads/manual-lead-form";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buildLeadFormState } from "@/lib/intake/validation";
import { cn } from "@/lib/utils";

export default function NewLeadPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <Card>
        <CardHeader className="space-y-3">
          <Badge className="w-fit" variant="info">
            Manual intake
          </Badge>
          <div className="space-y-2">
            <CardTitle className="text-3xl">Create a new lead</CardTitle>
            <CardDescription className="text-base leading-7">
              Add the first record manually from the dashboard. Each lead receives
              the default stage and a creation activity log entry automatically.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <ManualLeadForm initialState={buildLeadFormState()} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Badge className="w-fit" variant="success">
            Phase 03 rules
          </Badge>
          <CardTitle>What happens on submit</CardTitle>
          <CardDescription>
            Manual lead creation stays intentionally simple and deterministic in this
            phase.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm leading-6 text-slate-600">
            <li className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
              The lead is linked to the current workspace context.
            </li>
            <li className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
              Source is stored exactly as entered in the form.
            </li>
            <li className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
              Current stage is assigned to <span className="font-medium">New Lead</span>.
            </li>
            <li className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
              An initial activity log entry is created for the lead detail page.
            </li>
          </ul>
          <Link
            className={cn(
              buttonVariants({ variant: "secondary" }),
              "mt-5 inline-flex rounded-2xl",
            )}
            href="/leads"
          >
            Back to leads list
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

