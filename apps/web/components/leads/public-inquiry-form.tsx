"use client";

import { LoaderCircle } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { createPublicInquiryAction } from "@/app/inquiry/[workspaceSlug]/actions";
import { LeadFormFields } from "@/components/leads/lead-form-fields";
import { Button } from "@/components/ui/button";
import type { LeadFormState } from "@/lib/intake/types";

type PublicInquiryFormProps = {
  initialState: LeadFormState;
  workspaceSlug: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="rounded-2xl" size="lg" type="submit">
      {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
      {pending ? "Sending inquiry..." : "Submit inquiry"}
    </Button>
  );
}

export function PublicInquiryForm({
  initialState,
  workspaceSlug,
}: PublicInquiryFormProps) {
  const action = createPublicInquiryAction.bind(null, workspaceSlug);
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <input name="source" type="hidden" value={state.values.source || "Public Inquiry"} />
      <LeadFormFields
        errors={state.errors}
        showSource={false}
        values={state.values}
      />

      {state.message ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.message}
        </div>
      ) : null}

      <SubmitButton />
    </form>
  );
}

