"use client";

import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { createManualLeadAction } from "@/app/(dashboard)/leads/actions";
import { LeadFormFields } from "@/components/leads/lead-form-fields";
import { Button, buttonVariants } from "@/components/ui/button";
import type { LeadFormState } from "@/lib/intake/types";
import { cn } from "@/lib/utils";

type ManualLeadFormProps = {
  initialState: LeadFormState;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="rounded-2xl" size="lg" type="submit">
      {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
      {pending ? "Creating lead..." : "Create lead"}
    </Button>
  );
}

export function ManualLeadForm({ initialState }: ManualLeadFormProps) {
  const [state, formAction] = useActionState(createManualLeadAction, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <LeadFormFields errors={state.errors} showSource values={state.values} />

      {state.message ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.message}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton />
        <Link
          className={cn(buttonVariants({ variant: "ghost" }), "rounded-2xl")}
          href="/leads"
        >
          Back to leads
        </Link>
      </div>
    </form>
  );
}
