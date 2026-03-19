import { PlaceholderPage } from "@/components/app/placeholder-page";

export default function InvoicesPage() {
  return (
    <PlaceholderPage
      description="Billing workflows and manual payment tracking will land here in the billing phase. This placeholder preserves the future route and keeps the dashboard structure coherent from the start."
      highlights={[
        {
          title: "Billing route reserved",
          description:
            "The layout and navigation already account for invoice visibility inside the main workspace.",
        },
        {
          title: "Manual-first V1 model",
          description:
            "External payment links and manual status tracking fit here without building gateway ownership now.",
        },
        {
          title: "Dashboard consistency",
          description:
            "Invoice workflows will inherit the same shell, header, and session checks as every other module.",
        },
        {
          title: "No business logic yet",
          description:
            "No invoice schema, overdue calculations, or payment state updates are introduced in Phase 02.",
        },
      ]}
      nextSteps={[
        "Add invoice list and create flow.",
        "Track due date, amount, and manual status updates.",
        "Layer overdue reminders in the automation phase later.",
      ]}
      title="Invoices"
    />
  );
}

