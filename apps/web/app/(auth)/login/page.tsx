import { ArrowRight, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { BrandMark } from "@/components/app/brand-mark";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import { LoginForm } from "./login-form";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = getSingleValue(params.next) ?? "/dashboard";
  const error = getSingleValue(params.error);

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect(nextPath.startsWith("/") ? nextPath : "/dashboard");
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.22),transparent_35%),linear-gradient(180deg,#eff6ff_0%,#f8fafc_28%,#eef3f9_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative overflow-hidden rounded-[36px] bg-[linear-gradient(160deg,#0f172a_0%,#1e293b_52%,#0f766e_100%)] p-8 text-white shadow-[0_40px_120px_-48px_rgba(15,23,42,0.8)] sm:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(125,211,252,0.26),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(45,212,191,0.18),transparent_28%)]" />
          <div className="relative flex h-full flex-col justify-between gap-12">
            <div className="space-y-8">
              <BrandMark />

              <div className="space-y-5">
                <Badge className="w-fit bg-white/12 text-slate-100" variant="default">
                  Phase 02
                </Badge>
                <div className="space-y-3">
                  <h1 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
                    Secure the workspace before the operations layer arrives.
                  </h1>
                  <p className="max-w-xl text-base leading-8 text-slate-200">
                    ClientFlow AI starts with a protected dashboard shell for owners
                    and staff. Sign in to access the product workspace, navigation,
                    and future module surfaces.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/15 bg-white/8 p-4">
                  <ShieldCheck className="h-5 w-5 text-sky-300" />
                  <p className="mt-3 text-sm font-semibold">Protected routes</p>
                  <p className="mt-1 text-sm text-slate-300">
                    Dashboard pages stay behind Supabase auth.
                  </p>
                </div>
                <div className="rounded-3xl border border-white/15 bg-white/8 p-4">
                  <LockKeyhole className="h-5 w-5 text-sky-300" />
                  <p className="mt-3 text-sm font-semibold">Session-safe shell</p>
                  <p className="mt-1 text-sm text-slate-300">
                    Middleware refreshes sessions before protected views render.
                  </p>
                </div>
                <div className="rounded-3xl border border-white/15 bg-white/8 p-4">
                  <Sparkles className="h-5 w-5 text-sky-300" />
                  <p className="mt-3 text-sm font-semibold">Module scaffolds</p>
                  <p className="mt-1 text-sm text-slate-300">
                    Leads, follow-ups, docs, invoices, imports, and settings are ready.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/12 bg-black/10 p-5">
              <p className="text-sm text-slate-200">
                V1 stays dashboard-first and email-first. No Smart Intake, workflow
                logic, or AI automation is mixed into this phase.
              </p>
            </div>
          </div>
        </section>

        <section className="flex items-center">
          <Card className="w-full rounded-[32px]">
            <CardHeader className="space-y-5 p-8 pb-0">
              <div className="space-y-2">
                <Badge className="w-fit" variant="info">
                  Owner / Staff access
                </Badge>
                <CardTitle className="text-3xl">Sign in to ClientFlow AI</CardTitle>
                <CardDescription className="text-base leading-7">
                  Use the Supabase user credentials for your workspace. Successful
                  sign-in redirects into the protected dashboard shell.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              {!isSupabaseConfigured() ? (
                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-900">
                  <p className="font-semibold">Supabase configuration missing</p>
                  <p className="mt-2">
                    Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
                    <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to your local env
                    before testing the login flow.
                  </p>
                </div>
              ) : null}

              {error === "config" ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700">
                  Protected routes are enabled, but the required Supabase env values
                  are not available yet.
                </div>
              ) : null}

              <LoginForm nextPath={nextPath} />

              <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5 text-sm leading-7 text-slate-600">
                <p className="font-semibold text-slate-900">Testing checklist</p>
                <ul className="mt-3 space-y-2">
                  <li>Use an existing Supabase auth user or create one in your project.</li>
                  <li>Unauthenticated requests should land back on this page.</li>
                  <li>Successful login should open the dashboard shell immediately.</li>
                </ul>
                <Link
                  className="mt-4 inline-flex items-center gap-2 font-semibold text-sky-700"
                  href="/dashboard"
                >
                  Protected dashboard route
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
