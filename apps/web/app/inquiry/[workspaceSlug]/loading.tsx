import { Card, CardContent } from "@/components/ui/card";

export default function PublicInquiryLoading() {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="min-h-[480px]" />
        <Card>
          <CardContent className="space-y-4 p-8">
            <div className="h-6 w-32 animate-pulse rounded-full bg-slate-200" />
            <div className="h-12 w-72 animate-pulse rounded-2xl bg-slate-200" />
            <div className="h-11 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-11 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
