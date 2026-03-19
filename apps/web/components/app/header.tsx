"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";

import { LogoutButton } from "@/components/app/logout-button";
import { Button } from "@/components/ui/button";
import { getActiveNavigationItem } from "@/lib/navigation";

type HeaderProps = {
  onOpenSidebar: () => void;
  userDisplayName: string;
  userEmail: string;
};

export function Header({
  onOpenSidebar,
  userDisplayName,
  userEmail,
}: HeaderProps) {
  const pathname = usePathname();
  const activeItem = getActiveNavigationItem(pathname);
  const initials = userDisplayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <header className="sticky top-0 z-30 border-b border-white/70 bg-[rgba(245,247,251,0.9)] backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            className="lg:hidden"
            onClick={onOpenSidebar}
            size="icon"
            variant="secondary"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open navigation</span>
          </Button>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
              Authenticated workspace
            </p>
            <h1 className="truncate text-2xl font-semibold text-slate-950">
              {activeItem.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 rounded-2xl border border-white/80 bg-white px-4 py-3 shadow-sm sm:flex">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
              {initials || "CF"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-950">
                {userDisplayName}
              </p>
              <p className="truncate text-sm text-slate-500">{userEmail}</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}

