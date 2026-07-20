import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Users } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getTeams } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/teams")({
  head: () => ({
    meta: [
      { title: "Teams — Learning Hub" },
      { name: "description", content: "Browse teams grouped by designation." },
    ],
  }),
  component: TeamsPage,
});

// Colour accent per designation tier
function accentForName(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("senior")) return "bg-violet-50 border-violet-200 text-violet-700";
  if (n.includes("associate")) return "bg-emerald-50 border-emerald-200 text-emerald-700";
  if (n.includes("project lead") || n.includes("scrum") || n.includes("technical project")) return "bg-amber-50 border-amber-200 text-amber-700";
  return "bg-primary/5 border-primary/20 text-primary";
}

function iconAccent(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("senior")) return "bg-violet-100 text-violet-600";
  if (n.includes("associate")) return "bg-emerald-100 text-emerald-600";
  if (n.includes("project lead") || n.includes("scrum") || n.includes("technical project")) return "bg-amber-100 text-amber-700";
  return "bg-primary/10 text-primary";
}

function TeamsPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["teams", search],
    queryFn: () => getTeams({ page: 1, page_size: 100, search: search || undefined }),
    staleTime: 1000 * 60,
  });

  const teams = data?.items ?? [];

  return (
    <AppLayout>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Teams</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Employees grouped by designation. Use these teams when scheduling events.
          </p>
        </div>
        <Badge variant="outline" className="bg-secondary self-start sm:self-auto">
          {teams.length} teams
        </Badge>
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by designation..."
          className="pl-9"
        />
      </div>

      {isLoading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-secondary/40 h-28 animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive text-center">
          Unable to load teams. Make sure the backend is running.
        </div>
      )}

      {!isLoading && !isError && teams.length === 0 && (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          No teams found{search ? ` matching "${search}"` : ""}.
        </div>
      )}

      {!isLoading && !isError && teams.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <Card
              key={team.id}
              className={cn(
                "p-5 border hover-lift transition-all shadow-soft",
                accentForName(team.name),
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                  iconAccent(team.name),
                )}>
                  <Users className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm leading-snug">{team.name}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge
                      variant="secondary"
                      className="text-xs px-2 py-0.5 bg-white/60 border border-current/20"
                    >
                      {team.member_count} {team.member_count === 1 ? "member" : "members"}
                    </Badge>
                    {team.is_active && (
                      <span className="text-[11px] font-medium text-emerald-600">Active</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
