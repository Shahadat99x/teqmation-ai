import { PlaceholderPage } from "@/components/app/placeholder-page";

export default function ImportsPage() {
  return (
    <PlaceholderPage
      description="Bulk import work belongs in a dedicated module, but not yet. This route establishes the place where CSV upload, validation, and import review will eventually live."
      highlights={[
        {
          title: "CSV import surface planned",
          description:
            "The future flow will support upload, parsing, validation, and result review from this page.",
        },
        {
          title: "Server-owned validation later",
          description:
            "Import cleaning and duplicate checks stay in backend logic, not in the placeholder UI.",
        },
        {
          title: "Navigation stability now",
          description:
            "The route exists so later feature work can focus on import logic rather than shell wiring.",
        },
        {
          title: "No fake processing",
          description:
            "This page intentionally avoids simulated uploads or invented import reports.",
        },
      ]}
      nextSteps={[
        "Add CSV upload and status history UI.",
        "Connect server-side parsing and validation.",
        "Show success, failure, and duplicate summaries.",
      ]}
      title="Imports"
    />
  );
}

