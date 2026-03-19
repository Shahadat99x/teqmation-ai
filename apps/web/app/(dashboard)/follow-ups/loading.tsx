import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FollowUpsLoading() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Loading follow-ups...</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              className="h-24 animate-pulse rounded-2xl bg-slate-100"
              key={`follow-up-skeleton-${index}`}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
