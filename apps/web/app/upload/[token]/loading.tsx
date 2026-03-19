import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PublicUploadLoading() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Loading upload page...</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                className="h-24 animate-pulse rounded-2xl bg-slate-100"
                key={`upload-skeleton-${index}`}
              />
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
