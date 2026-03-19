import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Workflow } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { navigationItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

const shellCards = [
  {
    label: "Authentication",
    value: "Live",
    description: "Supabase sign-in, logout, and protected routes are wired into the app shell.",
    variant: "success" as const,
  },
  {
    label: "Session handling",
    value: "Ready",
    description: "Middleware refreshes auth state before dashboard routes render.",
    variant: "info" as const,
  },
  {
    label: "Module routing",
    value: "Scaffolded",
    description: "Core navigation routes exist so future business modules have a stable home.",
    variant: "warning" as const,
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(120deg,#ffffff_0%,#f0f7ff_54%,#e0f2fe_100%)] p-6 shadow-[0_32px_80px_-52px_rgba(14,116,144,0.4)] sm:p-8">
        <div className="absolute -right-20 top-0 h-56 w-56 rounded-full bg-sky-200/35 blur-3xl" />
        <div className="relative grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <Badge className="w-fit" variant="info">
              Auth + dashboard shell
            </Badge>
            <div className="space-y-3">
              <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                The first usable ClientFlow AI workspace is now in place.
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                This phase establishes the protected operational shell for owners and
                staff. The navigation, layout, and authenticated route structure are
                ready for real product modules to plug into without reworking the app
                frame later.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                className={cn(buttonVariants({ size: "lg" }), "rounded-2xl")}
                href="/leads"
              >
                Explore module placeholders
                <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                <ShieldCheck className="h-4 w-4 text-sky-600" />
                Workspace-safe foundation for later phases
              </div>
            </div>
          </div>

          <Card className="rounded-[28px] border-sky-100 bg-slate-950 text-white">
            <CardHeader>
              <div className="flex items-center gap-2 text-sky-300">
                <Workflow className="h-5 w-5" />
                <p className="text-sm font-medium">Phase handoff</p>
              </div>
              <CardTitle className="text-white">
                What Phase 03 can build on immediately
              </CardTitle>
              <CardDescription className="text-slate-300">
                Real lead workflows can now attach to stable routes, layout chrome,
                and authenticated sessions instead of rebuilding shell concerns.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm leading-6 text-slate-300">
                <li className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  Manual lead creation and list views
                </li>
                <li className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  Public inquiry intake into the protected workspace
                </li>
                <li className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  Source tracking and lead detail scaffolding
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {shellCards.map((card) => (
          <Card key={card.label}>
            <CardHeader>
              <Badge className="w-fit" variant={card.variant}>
                {card.value}
              </Badge>
              <CardTitle>{card.label}</CardTitle>
              <CardDescription>{card.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <Badge className="w-fit" variant="success">
              Module map
            </Badge>
            <CardTitle>Core workspace routes</CardTitle>
            <CardDescription>
              Every major V1 module now has a routed placeholder page inside the
              authenticated shell.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  className="group rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 transition-colors hover:border-sky-200 hover:bg-sky-50"
                  href={item.href}
                  key={item.href}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-slate-950">
                        {item.title}
                      </p>
                      <p className="text-sm leading-6 text-slate-500">
                        {item.description}
                      </p>
                    </div>
                    <Icon className="mt-0.5 h-4 w-4 text-slate-400 transition-colors group-hover:text-sky-600" />
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Badge className="w-fit" variant="warning">
              Intentionally not in this phase
            </Badge>
            <CardTitle>Scope held back on purpose</CardTitle>
            <CardDescription>
              This shell is disciplined. It avoids jumping into business logic before
              the app frame is stable.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm leading-6 text-slate-600">
              <li className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                No lead CRUD or intake forms yet
              </li>
              <li className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                No workflow automations, AI actions, or n8n orchestration
              </li>
              <li className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                No advanced permissions or workspace switching
              </li>
              <li className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                No analytics or later-phase reporting surfaces
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-sky-700">
              <Sparkles className="h-5 w-5" />
              <CardTitle>Why this matters</CardTitle>
            </div>
            <CardDescription>
              A stable shell reduces churn in later phases and keeps product work
              focused on business modules rather than redoing auth and layout.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next implementation target</CardTitle>
            <CardDescription>
              Phase 03 should attach real lead list, manual lead create, and public
              inquiry intake to the routes already created here.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    </div>
  );
}

