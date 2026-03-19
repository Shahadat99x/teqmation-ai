"use client";

import { CheckCircle2, LoaderCircle } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { createInvoiceAction } from "@/app/(dashboard)/invoices/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { InvoiceFormState } from "@/lib/invoices/types";

type InvoiceFormProps = {
  initialState: InvoiceFormState;
  leadId: string;
};

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-rose-600">{message}</p>;
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="rounded-2xl" type="submit">
      {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
      {pending ? "Creating..." : "Create invoice"}
    </Button>
  );
}

export function InvoiceForm({ initialState, leadId }: InvoiceFormProps) {
  const action = createInvoiceAction.bind(null, leadId);
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="amount">
            Amount
          </label>
          <Input
            defaultValue={state.values.amount}
            id="amount"
            inputMode="decimal"
            name="amount"
            placeholder="250.00"
            required
          />
          <p className="text-xs text-slate-500">Stored as cents for deterministic billing state.</p>
          <FieldError message={state.errors.amount} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="dueDate">
            Due date
          </label>
          <Input
            defaultValue={state.values.dueDate}
            id="dueDate"
            name="dueDate"
            required
            type="date"
          />
          <FieldError message={state.errors.dueDate} />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="externalPaymentLink">
          External payment link
        </label>
        <Input
          defaultValue={state.values.externalPaymentLink}
          id="externalPaymentLink"
          name="externalPaymentLink"
          placeholder="https://pay.example.com/invoice/123"
          type="url"
        />
        <p className="text-xs text-slate-500">
          Optional. Keep payment ownership external in V1 and just store the link here.
        </p>
        <FieldError message={state.errors.externalPaymentLink} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="note">
          Note
        </label>
        <Textarea
          defaultValue={state.values.note}
          id="note"
          name="note"
          placeholder="Optional billing context or instructions"
        />
        <FieldError message={state.errors.note} />
      </div>

      <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <input
          className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
          defaultChecked={state.values.sendNow}
          name="sendNow"
          type="checkbox"
        />
        <span>
          Queue invoice send workflow now
          <span className="mt-1 block text-xs text-slate-500">
            This keeps the invoice as app-owned truth and lets n8n handle the email send step.
          </span>
        </span>
      </label>

      {state.message ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
            <p className="font-medium text-slate-950">{state.message}</p>
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
