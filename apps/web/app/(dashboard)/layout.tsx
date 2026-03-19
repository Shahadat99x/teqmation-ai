import { redirect } from "next/navigation";

import { AppShell } from "@/components/app/app-shell";
import { isSupabaseConfigured } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured()) {
    redirect("/login?error=config");
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userDisplayName =
    user.user_metadata.full_name ??
    user.user_metadata.name ??
    user.email?.split("@")[0] ??
    "Team member";

  return (
    <AppShell userDisplayName={userDisplayName} userEmail={user.email ?? ""}>
      {children}
    </AppShell>
  );
}

