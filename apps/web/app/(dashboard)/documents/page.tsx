import { PlaceholderPage } from "@/components/app/placeholder-page";

export default function DocumentsPage() {
  return (
    <PlaceholderPage
      description="Documents will become the operational hub for request status and uploads. Right now the route exists so future file workflows can slot into the same secured dashboard shell."
      highlights={[
        {
          title: "Supabase-first storage direction",
          description:
            "Private student documents will use Supabase Storage, not public media tooling.",
        },
        {
          title: "Workspace-safe shell",
          description:
            "The route is already protected and ready for role-scoped document visibility.",
        },
        {
          title: "Operational empty state",
          description:
            "The placeholder makes it clear this module is planned without faking any upload behavior.",
        },
        {
          title: "Aligned with V1 process",
          description:
            "Document request lists and secure upload flows will build on this module later.",
        },
      ]}
      nextSteps={[
        "Add request checklist and upload status views.",
        "Wire secure upload paths to Supabase Storage.",
        "Expose missing-document reminders in later automation phases.",
      ]}
      title="Documents"
    />
  );
}

