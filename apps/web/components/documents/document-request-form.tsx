"use client";

import Link from "next/link";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { createDocumentRequestAction } from "@/app/(dashboard)/documents/actions";
import { Button } from "@/components/ui/button";
import type {
  DocumentRequestFormState,
  DocumentType,
} from "@/lib/documents/types";

type DocumentRequestFormProps = {
  initialState: DocumentRequestFormState;
  leadId: string;
};

const documentOptions: Array<{ label: string; value: DocumentType }> = [
  { label: "Passport", value: "passport" },
  { label: "Transcript", value: "transcript" },
  { label: "IELTS", value: "IELTS" },
  { label: "CV", value: "CV" },
  { label: "Photo", value: "photo" },
  { label: "Other", value: "other" },
];

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="rounded-2xl" type="submit">
      {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
      {pending ? "Creating..." : "Request documents"}
    </Button>
  );
}

export function DocumentRequestForm({
  initialState,
  leadId,
}: DocumentRequestFormProps) {
  const action = createDocumentRequestAction.bind(null, leadId);
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-slate-700">
            Checklist items
          </label>
          <p className="text-sm text-slate-500">
            Choose which documents the lead should upload.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {documentOptions.map((option) => (
            <label
              className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
              key={option.value}
            >
              <input
                className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                defaultChecked={state.values.documentTypes.includes(option.value)}
                name="documentTypes"
                type="checkbox"
                value={option.value}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
        {state.errors.documentTypes ? (
          <p className="text-sm text-rose-600">{state.errors.documentTypes}</p>
        ) : null}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="dueDate">
            Due date
          </label>
          <input
            className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            defaultValue={state.values.dueDate}
            id="dueDate"
            name="dueDate"
            type="date"
          />
          {state.errors.dueDate ? (
            <p className="text-sm text-rose-600">{state.errors.dueDate}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="note">
            Request note
          </label>
          <input
            className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            defaultValue={state.values.note}
            id="note"
            name="note"
            placeholder="Optional message for the upload request"
          />
          {state.errors.note ? (
            <p className="text-sm text-rose-600">{state.errors.note}</p>
          ) : null}
        </div>
      </div>

      {state.message ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
            <div className="space-y-2">
              <p className="font-medium text-slate-950">{state.message}</p>
              {state.uploadUrl ? (
                <div className="space-y-2">
                  <p className="break-all text-slate-600">{state.uploadUrl}</p>
                  <Link
                    className="inline-flex text-sm font-medium text-sky-700"
                    href={state.uploadUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Open upload link
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {state.errors.form ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.errors.form}
        </div>
      ) : null}

      <SubmitButton />
    </form>
  );
}
