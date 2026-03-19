import { PlaceholderPage } from "@/components/app/placeholder-page";

export default function LeadsPage() {
  return (
    <PlaceholderPage
      description="This route is reserved for the operational lead list. Phase 03 will layer in manual creation, public inquiry intake, and the first real table view without changing the surrounding shell."
      highlights={[
        {
          title: "Protected workspace route",
          description:
            "Only authenticated owner and staff sessions can load this module.",
        },
        {
          title: "Ready for lead list UI",
          description:
            "The layout, header, and navigation are already in place for a searchable lead index.",
        },
        {
          title: "Aligned with V1 intake",
          description:
            "Manual and form-based intake will attach here rather than introducing a separate experience.",
        },
        {
          title: "No premature CRUD",
          description:
            "The placeholder keeps scope disciplined until Phase 03 lands the actual lead model and flows.",
        },
      ]}
      nextSteps={[
        "Add the first lead table and manual create flow.",
        "Introduce public inquiry form intake into the same workspace.",
        "Store source information and basic activity logging.",
      ]}
      title="Leads"
    />
  );
}

