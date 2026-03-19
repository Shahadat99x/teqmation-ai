"use client";

import { useState, type ReactNode } from "react";

import { Header } from "@/components/app/header";
import { Sidebar } from "@/components/app/sidebar";

type AppShellProps = {
  children: ReactNode;
  userDisplayName: string;
  userEmail: string;
};

export function AppShell({
  children,
  userDisplayName,
  userEmail,
}: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className="hidden w-[304px] border-r border-white/70 bg-[#eef2f8] lg:block">
          <Sidebar />
        </aside>

        {isSidebarOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              className="absolute inset-0 bg-slate-950/45"
              onClick={() => setIsSidebarOpen(false)}
              type="button"
            >
              <span className="sr-only">Close sidebar backdrop</span>
            </button>
            <div className="relative z-10 h-full w-[88vw] max-w-sm bg-[#eef2f8] shadow-2xl">
              <Sidebar
                mobile
                onClose={() => setIsSidebarOpen(false)}
                onNavigate={() => setIsSidebarOpen(false)}
              />
            </div>
          </div>
        ) : null}

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <Header
            onOpenSidebar={() => setIsSidebarOpen(true)}
            userDisplayName={userDisplayName}
            userEmail={userEmail}
          />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

