import type { LucideIcon } from "lucide-react";
import {
  BellRing,
  FileText,
  LayoutDashboard,
  ReceiptText,
  Settings2,
  Upload,
  Users,
} from "lucide-react";

export type NavigationItem = {
  title: string;
  href: string;
  description: string;
  icon: LucideIcon;
};

export const navigationItems: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    description: "Workspace overview and launch point for the rest of the product.",
    icon: LayoutDashboard,
  },
  {
    title: "Leads",
    href: "/leads",
    description: "Manual intake, public inquiries, and the first CRM records.",
    icon: Users,
  },
  {
    title: "Follow-ups",
    href: "/follow-ups",
    description: "Reminder and communication queues for the team.",
    icon: BellRing,
  },
  {
    title: "Documents",
    href: "/documents",
    description: "Private document workflows and storage status.",
    icon: FileText,
  },
  {
    title: "Invoices",
    href: "/invoices",
    description: "Billing visibility and invoice status tracking.",
    icon: ReceiptText,
  },
  {
    title: "Imports",
    href: "/imports",
    description: "CSV import and cleaning flows for later phases.",
    icon: Upload,
  },
  {
    title: "Settings",
    href: "/settings",
    description: "Workspace defaults, team setup, and product configuration.",
    icon: Settings2,
  },
];

export function isNavigationItemActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getActiveNavigationItem(pathname: string) {
  return (
    navigationItems.find((item) => isNavigationItemActive(pathname, item.href)) ??
    navigationItems[0]
  );
}
