import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getHealthStatus } from "@/lib/api";

export const Route = createFileRoute("/health")({
  head: () => ({
    meta: [
      { title: "Health — Learning Hub" },
      { name: "description", content: "Check the backend health status of the Learning Hub service." },
    ],
  }),
  component: HealthPage,
});

function HealthPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["health"],
    queryFn: getHealthStatus,
    retry: false,
  });

  return (
    <AppLayout>
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Health</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Verify the API status and service availability for the backend.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{isLoading ? "Checking..." : isError ? "Unavailable" : data?.status}</Badge>
        </div>
      </div>

      <Card className="p-6 shadow-card border-border/60">
        <div className="grid gap-4">
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-secondary/50 p-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Service</div>
              <div className="text-lg font-semibold">{data?.service ?? "Learning Hub API"}</div>
            </div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{isLoading ? "Loading" : isError ? "Offline" : "Healthy"}</div>
          </div>
          <div className="rounded-2xl bg-card p-4 text-sm text-muted-foreground">
            {isError
              ? "The backend health endpoint could not be reached. Confirm the API server is running and the environment is configured correctly."
              : "The backend service is reporting healthy status and is ready to serve requests."}
          </div>
        </div>
      </Card>
    </AppLayout>
  );
}
