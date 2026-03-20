import { StageBadge } from "@/components/stages/stage-badge";
import type { LeadStageHistoryRecord } from "@/lib/stages/types";
import { formatDateTime } from "@/lib/utils";

export function StageHistoryList({ history }: { history: LeadStageHistoryRecord[] }) {
  if (history.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
        No stage movements have been recorded yet.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {history.map((entry) => (
        <li
          className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4"
          key={entry.id}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {entry.from_stage ? <StageBadge stageName={entry.from_stage.name} /> : null}
                <span className="text-sm text-slate-400">→</span>
                <StageBadge stageName={entry.to_stage.name} />
              </div>
              <p className="text-sm text-slate-600">
                {entry.from_stage
                  ? `Moved from ${entry.from_stage.name} to ${entry.to_stage.name}.`
                  : `Lead entered ${entry.to_stage.name}.`}
              </p>
            </div>
            <div className="text-right text-xs text-slate-500">
              <p>{formatDateTime(entry.changed_at)}</p>
              <p>{entry.changed_by_user_id ? "Updated by team member" : "System recorded"}</p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
