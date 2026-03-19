import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Highlight = {
  title: string;
  description: string;
};

type PlaceholderPageProps = {
  title: string;
  description: string;
  highlights: Highlight[];
  nextSteps: string[];
};

export function PlaceholderPage({
  title,
  description,
  highlights,
  nextSteps,
}: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_55%,#0369a1_100%)] px-6 py-8 text-white shadow-[0_32px_80px_-40px_rgba(15,23,42,0.7)] sm:px-8">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_top,#7dd3fc_0%,transparent_60%)] opacity-60 lg:block" />
        <div className="relative max-w-2xl space-y-4">
          <Badge className="w-fit bg-white/12 text-slate-100" variant="default">
            Phase 02 placeholder
          </Badge>
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {title}
            </h2>
            <p className="max-w-xl text-sm leading-7 text-slate-200 sm:text-base">
              {description}
            </p>
          </div>
          <Link
            className={cn(
              buttonVariants({ size: "lg", variant: "secondary" }),
              "w-fit rounded-2xl bg-white text-slate-950 hover:bg-slate-100",
            )}
            href="/dashboard"
          >
            Back to dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="grid gap-6 md:grid-cols-2">
          {highlights.map((highlight) => (
            <Card key={highlight.title}>
              <CardHeader>
                <CardTitle>{highlight.title}</CardTitle>
                <CardDescription>{highlight.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Badge className="w-fit" variant="info">
              Next phase handoff
            </Badge>
            <CardTitle>What gets built on this shell</CardTitle>
            <CardDescription>
              This page is intentionally lean. The goal is to prove navigation,
              route protection, and the future workspace structure.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm leading-6 text-slate-600">
              {nextSteps.map((step) => (
                <li
                  className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                  key={step}
                >
                  {step}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
