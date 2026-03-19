import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DocumentsLoading() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Loading documents...</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              className="h-24 animate-pulse rounded-2xl bg-slate-100"
              key={`documents-skeleton-${index}`}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
