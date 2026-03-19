import { PlaceholderPage } from "@/components/app/placeholder-page";

export default function SettingsPage() {
  return (
    <PlaceholderPage
      description="Settings will hold workspace-level product configuration once the business modules arrive. For now, the route provides a stable home for future defaults and operational preferences."
      highlights={[
        {
          title: "Workspace config anchor",
          description:
            "Default source options, stage settings, and later provider controls will live here.",
        },
        {
          title: "Owner / staff shell",
          description:
            "The page already follows the correct protected dashboard access model for internal users.",
        },
        {
          title: "No advanced permissions",
          description:
            "Complex role and policy management stays out of this phase by design.",
        },
        {
          title: "Clean extension point",
          description:
            "Future settings can grow without reworking the sidebar or page framing later.",
        },
      ]}
      nextSteps={[
        "Add basic workspace profile settings.",
        "Introduce source defaults and stage config later.",
        "Layer email and AI provider settings only in the relevant future phases.",
      ]}
      title="Settings"
    />
  );
}
