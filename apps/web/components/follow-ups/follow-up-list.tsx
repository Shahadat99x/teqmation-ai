"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { LoaderCircle, Mail, SkipForward, UserCheck } from "lucide-react";
import { useFormStatus } from "react-dom";

import { updateFollowUpStatusAction } from "@/app/(dashboard)/follow-ups/actions";
import { FollowUpStatusBadge } from "@/components/follow-ups/follow-up-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FollowUpRecord, FollowUpStatus } from "@/lib/follow-ups/types";
import { formatDateTime } from "@/lib/utils";

type FollowUpListProps = {
  emptyMessage: string;
  followUps: FollowUpRecord[];
  showLeadLink?: boolean;
  showStatusActions?: boolean;
};

function ChannelBadge({ channel }: { channel: FollowUpRecord["channel"] }) {
  return <Badge variant={channel === "email" ? "info" : "default"}>{channel}</Badge>;
}

function getDueTone(followUp: FollowUpRecord) {
  if (followUp.status === "completed" || followUp.status === "skipped") {
    return {
      label: "Closed",
      tone: "text-slate-500",
    };
  }

  const dueAt = new Date(followUp.due_at).getTime();
  const now = Date.now();

  if (dueAt < now) {
    return {
      label: "Overdue",
      tone: "text-rose-600",
    };
  }

  if (dueAt - now <= 12 * 60 * 60 * 1000) {
    return {
      label: "Due soon",
      tone: "text-amber-600",
    };
  }

  return {
    label: "Upcoming",
    tone: "text-emerald-600",
  };
}

function StatusButton({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} size="sm" type="submit" variant="secondary">
      {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : icon}
      {pending ? "Saving..." : label}
    </Button>
  );
}

function StatusAction({
  followUpId,
  leadId,
  nextStatus,
}: {
  followUpId: string;
  leadId: string;
  nextStatus: FollowUpStatus;
}) {
  const config: Record<FollowUpStatus, { icon: ReactNode; label: string }> = {
    pending: {
      icon: <Mail className="h-4 w-4" />,
      label: "Reopen",
    },
    sent: {
      icon: <Mail className="h-4 w-4" />,
      label: "Mark sent",
    },
    completed: {
      icon: <UserCheck className="h-4 w-4" />,
      label: "Complete",
    },
    skipped: {
      icon: <SkipForward className="h-4 w-4" />,
      label: "Skip",
    },
  };

  return (
    <form action={updateFollowUpStatusAction}>
      <input name="followUpId" type="hidden" value={followUpId} />
      <input name="leadId" type="hidden" value={leadId} />
      <input name="status" type="hidden" value={nextStatus} />
      <StatusButton icon={config[nextStatus].icon} label={config[nextStatus].label} />
    </form>
  );
}

function FollowUpActions({ followUp }: { followUp: FollowUpRecord }) {
  if (followUp.status === "completed" || followUp.status === "skipped") {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {followUp.channel === "email" && followUp.status !== "sent" ? (
        <StatusAction
          followUpId={followUp.id}
          leadId={followUp.lead_id}
          nextStatus="sent"
        />
      ) : null}
      <StatusAction
        followUpId={followUp.id}
        leadId={followUp.lead_id}
        nextStatus="completed"
      />
      <StatusAction
        followUpId={followUp.id}
        leadId={followUp.lead_id}
        nextStatus="skipped"
      />
    </div>
  );
}

export function FollowUpList({
  emptyMessage,
  followUps,
  showLeadLink = true,
  showStatusActions = true,
}: FollowUpListProps) {
  if (followUps.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {followUps.map((followUp) => {
        const dueTone = getDueTone(followUp);

        return (
          <li
            className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4"
            key={followUp.id}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  {showLeadLink && followUp.lead ? (
                    <Link
                      className="text-sm font-semibold text-slate-950 hover:text-sky-700"
                      href={`/leads/${followUp.lead.id}`}
                    >
                      {followUp.lead.full_name}
                    </Link>
                  ) : (
                    <p className="text-sm font-semibold text-slate-950">
                      {followUp.template_name || "Follow-up reminder"}
                    </p>
                  )}
                  <p className="text-sm text-slate-600">
                    {followUp.template_name || followUp.note || "No reminder note added."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <FollowUpStatusBadge status={followUp.status} />
                  <ChannelBadge channel={followUp.channel} />
                  {followUp.lead?.source ? <Badge variant="default">{followUp.lead.source}</Badge> : null}
                </div>
                {showStatusActions ? <FollowUpActions followUp={followUp} /> : null}
              </div>

              <div className="space-y-1 text-right">
                <p className="text-sm font-medium text-slate-950">
                  {formatDateTime(followUp.due_at)}
                </p>
                <p className={`text-sm ${dueTone.tone}`}>{dueTone.label}</p>
                {followUp.last_reminded_at ? (
                  <p className="text-xs text-slate-500">
                    Last reminder {formatDateTime(followUp.last_reminded_at)}
                  </p>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
