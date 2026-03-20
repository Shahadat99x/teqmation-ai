"use client";

import { LoaderCircle } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { changeLeadStageAction } from "@/app/(dashboard)/leads/[leadId]/actions";
import { Button } from "@/components/ui/button";
import type { StageChangeFormState, StageRecord } from "@/lib/stages/types";
import { cn } from "@/lib/utils";

type StageSelectorFormProps = {
  currentStageId: string;
  initialState: StageChangeFormState;
  leadId: string;
  stages: StageRecord[];
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="rounded-2xl" type="submit">
      {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
      {pending ? "Updating..." : "Update stage"}
    </Button>
  );
}

export function StageSelectorForm({
  currentStageId,
  initialState,
  leadId,
  stages,
}: StageSelectorFormProps) {
  const action = changeLeadStageAction.bind(null, leadId, currentStageId);
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="stageId">
          Move lead to
        </label>
        <select
          className={cn(
            "flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            state.error ? "border-rose-300 focus-visible:ring-rose-500" : "",
          )}
          defaultValue={state.selectedStageId || currentStageId}
          id="stageId"
          name="stageId"
        >
          {stages.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.name}
            </option>
          ))}
        </select>
      </div>

      {state.error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </div>
      ) : null}

      {state.message ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {state.message}
        </div>
      ) : null}

      <SubmitButton />
    </form>
  );
}
