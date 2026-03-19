import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PipelineLoading() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Loading pipeline...</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              className="h-56 animate-pulse rounded-2xl bg-slate-100"
              key={`pipeline-skeleton-${index}`}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
