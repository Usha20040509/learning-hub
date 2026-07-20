import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useRef, useEffect } from "react";
import { Search, Users, Filter, X, ChevronDown } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  if (
    n.includes("project lead") ||
    n.includes("scrum") ||
    n.includes("technical project")
  )
    return "bg-amber-50 border-amber-200 text-amber-700";
  return "bg-primary/5 border-primary/20 text-primary";
}

function iconAccent(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("senior")) return "bg-violet-100 text-violet-600";
  if (n.includes("associate")) return "bg-emerald-100 text-emerald-600";
  if (
    n.includes("project lead") ||
    n.includes("scrum") ||
    n.includes("technical project")
  )
    return "bg-amber-100 text-amber-700";
  return "bg-primary/10 text-primary";
}

function TeamsPage() {
  const [search, setSearch] = useState("");
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [deptSearch, setDeptSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["teams", search],
    queryFn: () => getTeams({ page: 1, page_size: 100, search: search || undefined }),
    staleTime: 1000 * 60,
  });

  const teams = data?.items ?? [];

  // Derive unique department/designation labels from team names
  const allDepartments = useMemo(() => {
    return Array.from(new Set(teams.map((t) => t.name))).sort();
  }, [teams]);

  const filteredDeptOptions = useMemo(() => {
    if (!deptSearch) return allDepartments;
    return allDepartments.filter((d) =>
      d.toLowerCase().includes(deptSearch.toLowerCase()),
    );
  }, [allDepartments, deptSearch]);

  // Apply department filter: show all if none selected, otherwise show union
  const visibleTeams = useMemo(() => {
    if (selectedDepts.length === 0) return teams;
    return teams.filter((t) => selectedDepts.includes(t.name));
  }, [teams, selectedDepts]);

  function toggleDept(dept: string) {
    setSelectedDepts((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept],
    );
  }

  function toggleAll() {
    if (selectedDepts.length === allDepartments.length) {
      setSelectedDepts([]);
    } else {
      setSelectedDepts([...allDepartments]);
    }
  }

  function clearFilter() {
    setSelectedDepts([]);
    setDeptSearch("");
  }

  const allSelected =
    allDepartments.length > 0 && selectedDepts.length === allDepartments.length;

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
          {visibleTeams.length} {selectedDepts.length > 0 ? `of ${teams.length} ` : ""}teams
        </Badge>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by designation..."
            className="pl-9"
          />
        </div>

        {/* Department multi-select dropdown */}
        <div className="relative" ref={dropdownRef}>
          <Button
            id="dept-filter-trigger"
            variant="outline"
            className={cn(
              "h-9 gap-2 font-normal w-[210px] justify-between",
              selectedDepts.length > 0
                ? "border-primary/50 text-primary bg-primary/5"
                : "text-muted-foreground",
            )}
            onClick={() => setDropdownOpen((o) => !o)}
          >
            <span className="flex items-center gap-2 truncate">
              <Filter className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {selectedDepts.length > 0
                  ? `${selectedDepts.length} team${selectedDepts.length > 1 ? "s" : ""} selected`
                  : "All departments"}
              </span>
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 transition-transform",
                dropdownOpen && "rotate-180",
              )}
            />
          </Button>

          {dropdownOpen && (
            <div
              className="absolute z-50 mt-1 left-0 w-[240px] rounded-lg border border-border bg-popover shadow-lg"
              role="listbox"
              aria-multiselectable="true"
            >
              {/* Search inside dropdown */}
              <div className="p-2 border-b border-border">
                <Input
                  value={deptSearch}
                  onChange={(e) => setDeptSearch(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder="Search teams..."
                  className="h-8 text-sm"
                  autoFocus
                />
              </div>

              {/* Select All */}
              <div className="p-1">
                <label
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent text-sm font-medium select-none"
                  htmlFor="dept-select-all"
                >
                  <input
                    id="dept-select-all"
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                  Select All
                </label>
              </div>

              <div className="border-t border-border" />

              {/* Team list */}
              <div className="max-h-56 overflow-y-auto p-1 space-y-0.5">
                {filteredDeptOptions.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">
                    No teams match "{deptSearch}"
                  </p>
                ) : (
                  filteredDeptOptions.map((dept) => (
                    <label
                      key={dept}
                      className="flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent text-sm select-none"
                      htmlFor={`dept-${dept}`}
                    >
                      <input
                        id={`dept-${dept}`}
                        type="checkbox"
                        checked={selectedDepts.includes(dept)}
                        onChange={() => toggleDept(dept)}
                        className="h-4 w-4 rounded border-input accent-primary"
                      />
                      <span className="truncate">{dept}</span>
                    </label>
                  ))
                )}
              </div>

              {/* Clear filter footer */}
              {selectedDepts.length > 0 && (
                <>
                  <div className="border-t border-border" />
                  <div className="p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
                      onClick={() => {
                        clearFilter();
                        setDropdownOpen(false);
                      }}
                    >
                      <X className="h-3 w-3" />
                      Clear Filter
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Active filter chips */}
        {selectedDepts.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground gap-1.5 px-2"
            onClick={clearFilter}
          >
            <X className="h-3 w-3" />
            Clear Filter
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-secondary/40 h-28 animate-pulse"
            />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive text-center">
          Unable to load teams. Make sure the backend is running.
        </div>
      )}

      {!isLoading && !isError && visibleTeams.length === 0 && (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          {selectedDepts.length > 0
            ? "No teams match the selected filters."
            : search
              ? `No teams found matching "${search}".`
              : "No teams found."}
        </div>
      )}

      {!isLoading && !isError && visibleTeams.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleTeams.map((team) => (
            <Card
              key={team.id}
              className={cn(
                "p-5 border hover-lift transition-all shadow-soft",
                accentForName(team.name),
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                    iconAccent(team.name),
                  )}
                >
                  <Users className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm leading-snug">{team.name}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge
                      variant="secondary"
                      className="text-xs px-2 py-0.5 bg-white/60 border border-current/20"
                    >
                      {team.member_count}{" "}
                      {team.member_count === 1 ? "member" : "members"}
                    </Badge>
                    {team.is_active && (
                      <span className="text-[11px] font-medium text-emerald-600">
                        Active
                      </span>
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
