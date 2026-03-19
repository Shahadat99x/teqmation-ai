import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function LeadsLoading() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="h-5 w-28 animate-pulse rounded-full bg-slate-200" />
          <div className="h-10 w-72 animate-pulse rounded-2xl bg-slate-200" />
        </CardHeader>
      </Card>
      <Card>
        <CardContent className="space-y-3 p-6">
          <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
        </CardContent>
      </Card>
    </div>
  );
}

