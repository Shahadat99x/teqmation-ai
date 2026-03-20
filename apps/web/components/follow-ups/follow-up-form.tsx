"use client";

import { LoaderCircle } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { createFollowUpAction } from "@/app/(dashboard)/follow-ups/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { FollowUpFormState } from "@/lib/follow-ups/types";
import { cn } from "@/lib/utils";

type FollowUpFormProps = {
  initialState: FollowUpFormState;
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
      {pending ? "Scheduling..." : "Schedule follow-up"}
    </Button>
  );
}

export function FollowUpForm({ initialState, leadId }: FollowUpFormProps) {
  const action = createFollowUpAction.bind(null, leadId);
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="dueAt">
            Due date and time
          </label>
          <Input
            defaultValue={state.values.dueAt}
            id="dueAt"
            name="dueAt"
            required
            type="datetime-local"
          />
          <p className="text-xs text-slate-500">Stored in UTC for reliable reminder timing.</p>
          <FieldError message={state.errors.dueAt} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="channel">
            Channel
          </label>
          <select
            className={cn(
              "flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              state.errors.channel ? "border-rose-300 focus-visible:ring-rose-500" : "",
            )}
            defaultValue={state.values.channel}
            id="channel"
            name="channel"
          >
            <option value="internal">Internal reminder</option>
            <option value="email">Email reminder</option>
          </select>
          <FieldError message={state.errors.channel} />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="templateName">
          Reminder label
        </label>
        <Input
          defaultValue={state.values.templateName}
          id="templateName"
          name="templateName"
          placeholder="Initial outreach"
        />
        <FieldError message={state.errors.templateName} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="note">
          Note
        </label>
        <Textarea
          defaultValue={state.values.note}
          id="note"
          name="note"
          placeholder="What should happen when this reminder is due?"
        />
        <FieldError message={state.errors.note} />
      </div>

      {state.message ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {state.message}
        </div>
      ) : null}

      <SubmitButton />
    </form>
  );
}
