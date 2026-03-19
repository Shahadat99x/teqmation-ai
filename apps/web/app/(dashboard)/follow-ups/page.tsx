import { PlaceholderPage } from "@/components/app/placeholder-page";

export default function FollowUpsPage() {
  return (
    <PlaceholderPage
      description="Follow-up operations will live here once reminder scheduling and status tracking arrive. In Phase 02 this page proves the navigation and protected route are ready for the workflow module."
      highlights={[
        {
          title: "Future reminder queue",
          description:
            "Due today, upcoming, and completed reminders will eventually surface here.",
        },
        {
          title: "Email-first direction",
          description:
            "This module is shaped for V1 reminder and email workflows, not social sync features.",
        },
        {
          title: "Session-safe navigation",
          description:
            "The page inherits the authenticated shell and team-facing layout immediately.",
        },
        {
          title: "No automation logic yet",
          description:
            "n8n reminders and workflow triggers stay out of scope until later phases.",
        },
      ]}
      nextSteps={[
        "Add reminder data model and status filters.",
        "Connect due follow-ups to the dashboard overview.",
        "Trigger reminder workflows through the automation layer later.",
      ]}
      title="Follow-ups"
    />
  );
}

