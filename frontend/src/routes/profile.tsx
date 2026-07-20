import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Learning Hub" },
      { name: "description", content: "Your employee profile." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const user = getCurrentUser();

  if (!user) {
    return (
      <AppLayout>
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
          <Card className="w-full max-w-md p-8 text-center">
            <h1 className="text-2xl font-semibold">Not signed in</h1>
            <p className="mt-4 text-sm text-muted-foreground">
              Sign in first to access your profile.
            </p>
            <div className="mt-6">
              <Button asChild>
                <Link to="/login">Go to login</Link>
              </Button>
            </div>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const initials = `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase();

  return (
    <AppLayout>
      <div className="grid min-h-[calc(100vh-4rem)] place-items-start px-4 py-8">
        <div className="w-full max-w-2xl space-y-6">
          {/* Header card */}
          <Card className="p-6 flex items-center gap-5">
            <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold truncate">
                {user.first_name} {user.last_name}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {user.job_title ?? "Employee"}
              </p>
              {user.group_name && (
                <Badge variant="secondary" className="mt-2 text-xs">
                  {user.group_name}
                </Badge>
              )}
            </div>
          </Card>

          {/* Details card */}
          <Card className="p-6 space-y-4">
            <h2 className="text-base font-semibold">Employee Details</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <DetailRow label="Employee ID" value={user.employee_id} />
              <DetailRow label="Email" value={user.email} />
              <DetailRow label="Designation" value={user.job_title} />
              <DetailRow label="Group" value={user.group_name} />
              <DetailRow label="Experience" value={user.years_experience} />
              <DetailRow label="Work Location" value={user.work_location} />
            </dl>
          </Card>

          <div className="flex justify-end">
            <Button asChild variant="outline">
              <Link to="/">Back to dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs uppercase tracking-wide">{label}</dt>
      <dd className="mt-0.5 font-medium text-foreground">{value ?? "—"}</dd>
    </div>
  );
}
