"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";

import { BrandMark } from "@/components/app/brand-mark";
import { Button } from "@/components/ui/button";
import {
  getActiveNavigationItem,
  isNavigationItemActive,
  navigationItems,
} from "@/lib/navigation";
import { cn } from "@/lib/utils";

type SidebarProps = {
  mobile?: boolean;
  onNavigate?: () => void;
  onClose?: () => void;
};

export function Sidebar({
  mobile = false,
  onNavigate,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const activeItem = getActiveNavigationItem(pathname);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 pb-6 pt-5">
        <BrandMark />
        {mobile ? (
          <Button
            className="text-slate-500"
            onClick={onClose}
            size="icon"
            variant="ghost"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close navigation</span>
          </Button>
        ) : null}
      </div>

      <div className="px-4">
        <div className="rounded-2xl border border-sky-100 bg-sky-50/80 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-sky-600">
            Workspace shell
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-950">
            {activeItem.title}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {activeItem.description}
          </p>
        </div>
      </div>

      <nav className="mt-6 flex-1 space-y-1 px-3">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = isNavigationItemActive(pathname, item.href);

          return (
            <Link
              className={cn(
                "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "bg-slate-950 text-white shadow-sm"
                  : "text-slate-600 hover:bg-white hover:text-slate-950",
              )}
              href={item.href}
              key={item.href}
              onClick={onNavigate}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  isActive ? "text-white" : "text-slate-400 group-hover:text-slate-700",
                )}
              />
              <div className="min-w-0">
                <p>{item.title}</p>
                <p
                  className={cn(
                    "truncate text-xs",
                    isActive ? "text-slate-300" : "text-slate-400",
                  )}
                >
                  {item.description}
                </p>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 pb-5 pt-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
          <p className="text-sm font-semibold text-slate-950">Phase 02 ready</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Auth, routing, and module shells are in place. Phase 03 can layer in
            real lead workflows next.
          </p>
        </div>
      </div>
    </div>
  );
}

