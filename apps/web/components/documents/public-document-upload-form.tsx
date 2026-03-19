"use client";

import { LoaderCircle } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { uploadDocumentAction } from "@/app/upload/[token]/actions";
import { Button } from "@/components/ui/button";
import type {
  DocumentRequestRecord,
  PublicDocumentUploadFormState,
} from "@/lib/documents/types";

type PublicDocumentUploadFormProps = {
  initialState: PublicDocumentUploadFormState;
  requests: DocumentRequestRecord[];
  token: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="rounded-2xl" size="lg" type="submit">
      {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
      {pending ? "Uploading..." : "Upload document"}
    </Button>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-rose-600">{message}</p>;
}

export function PublicDocumentUploadForm({
  initialState,
  requests,
  token,
}: PublicDocumentUploadFormProps) {
  const action = uploadDocumentAction.bind(null, token);
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="requestId">
          Checklist item
        </label>
        <select
          className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          defaultValue={state.values.requestId}
          id="requestId"
          name="requestId"
        >
          <option value="">Upload without linking a checklist item</option>
          {requests.map((request) => (
            <option key={request.id} value={request.id}>
              {request.label}
            </option>
          ))}
        </select>
        <FieldError message={state.errors.requestId} />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="documentType">
            Document type
          </label>
          <select
            className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            defaultValue={state.values.documentType}
            id="documentType"
            name="documentType"
          >
            <option value="passport">Passport</option>
            <option value="transcript">Transcript</option>
            <option value="IELTS">IELTS</option>
            <option value="CV">CV</option>
            <option value="photo">Photo</option>
            <option value="other">Other</option>
          </select>
          <FieldError message={state.errors.documentType} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="file">
            File
          </label>
          <input
            className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm file:mr-4 file:rounded-lg file:border-0 file:bg-sky-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-sky-700"
            id="file"
            name="file"
            required
            type="file"
          />
          <p className="text-xs text-slate-500">PDF, JPG, or PNG up to 10 MB.</p>
          <FieldError message={state.errors.file} />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="uploaderName">
            Your name
          </label>
          <input
            className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            defaultValue={state.values.uploaderName}
            id="uploaderName"
            name="uploaderName"
            placeholder="Student or parent name"
            required
          />
          <FieldError message={state.errors.uploaderName} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="uploaderEmail">
            Your email
          </label>
          <input
            className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            defaultValue={state.values.uploaderEmail}
            id="uploaderEmail"
            name="uploaderEmail"
            placeholder="you@example.com"
            type="email"
          />
          <FieldError message={state.errors.uploaderEmail} />
        </div>
      </div>

      {state.message ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.message}
        </div>
      ) : null}

      <SubmitButton />
    </form>
  );
}
