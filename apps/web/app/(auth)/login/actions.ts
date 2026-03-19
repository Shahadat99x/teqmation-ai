"use server";

import { AuthApiError } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type LoginActionState = {
  error?: string;
};

export async function signInAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  if (!isSupabaseConfigured()) {
    return {
      error:
        "Supabase environment variables are missing. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY first.",
    };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nextPath = String(formData.get("next") ?? "/dashboard");

  if (!email || !password) {
    return {
      error: "Enter both your email address and password.",
    };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      error:
        error instanceof AuthApiError ? error.message : "Unable to sign in right now.",
    };
  }

  redirect(nextPath.startsWith("/") ? nextPath : "/dashboard");
}

