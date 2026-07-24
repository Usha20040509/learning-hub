import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useRef, useEffect } from "react";
import { Search, Filter, X, ChevronDown } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getEmployees } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/employees")({
  head: () => ({
    meta: [
      { title: "Employees — Learning Hub" },
      { name: "description", content: "Browse and manage employee profiles and departments." },
    ],
  }),
  component: EmployeesPage,
});

function EmployeesPage() {
  const [search, setSearch] = useState("");
  const [deptSearch, setDeptSearch] = useState("");
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
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

  // Fetch ALL employees (only filtered by search term) so department list never shrinks
  const { data, isLoading, isError } = useQuery({
    queryKey: ["employees", search],
    queryFn: () =>
      getEmployees({
        page: 1,
        page_size: 500,
        search: search || undefined,
      }),
    keepPreviousData: true,
    refetchInterval: 10000,
  });

  const allEmployees = data?.items ?? [];

  // Derive full stable department/role list from all fetched employees
  const allDepartments = useMemo(
    () =>
      Array.from(new Set(allEmployees.flatMap((e) => [e.department, e.job_title]).filter(Boolean)))
        .sort() as string[],
    [allEmployees],
  );

  // Filtered dropdown options (by deptSearch)
  const filteredDeptOptions = useMemo(() => {
    if (!deptSearch) return allDepartments;
    return allDepartments.filter((d) =>
      d.toLowerCase().includes(deptSearch.toLowerCase()),
    );
  }, [allDepartments, deptSearch]);

  // Apply all client-side filters: dept/role multi-select
  const visibleEmployees = useMemo(() => {
    const filtered = allEmployees.filter((emp) => {
      const deptMatch =
        selectedDepts.length === 0 ||
        (emp.department != null && selectedDepts.includes(emp.department)) ||
        (emp.job_title != null && selectedDepts.includes(emp.job_title));
      return deptMatch;
    });
    return filtered.sort((a, b) => a.first_name.localeCompare(b.first_name) || a.last_name.localeCompare(b.last_name));
  }, [allEmployees, selectedDepts]);

  // --- Checkbox helpers ---
  const allSelected =
    allDepartments.length > 0 && selectedDepts.length === allDepartments.length;

  function toggleDept(dept: string) {
    setSelectedDepts((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept],
    );
  }

  function toggleAll() {
    setSelectedDepts(allSelected ? [] : [...allDepartments]);
  }

  function clearFilter() {
    setSelectedDepts([]);
    setDeptSearch("");
  }

  const hasFilters = selectedDepts.length > 0;

  return (
    <AppLayout>
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            View employee contact details, departments, and active status.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">
            {visibleEmployees.length}
            {hasFilters ? ` of ${allEmployees.length}` : ""} employees
          </Badge>
        </div>
      </div>

      <Card className="p-4 shadow-card border-border/60 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, department, or role..."
              className="pl-9"
            />
          </div>

          {/* Department multi-select */}
          <div className="relative" ref={dropdownRef}>
            <Button
              id="emp-dept-filter-trigger"
              variant="outline"
              className={cn(
                "h-9 gap-2 font-normal w-[220px] justify-between",
                selectedDepts.length > 0
                  ? "border-primary/50 text-primary bg-primary/5"
                  : "text-muted-foreground",
              )}
              onClick={() => setDropdownOpen((o) => !o)}
            >
              <span className="flex items-center gap-2 truncate min-w-0">
                <Filter className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  {selectedDepts.length > 0
                    ? `${selectedDepts.length} selected`
                    : "All departments & roles"}
                </span>
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform duration-200",
                  dropdownOpen && "rotate-180",
                )}
              />
            </Button>

            {dropdownOpen && (
              <div
                className="absolute z-50 mt-1 left-0 w-[260px] rounded-lg border border-border bg-popover shadow-lg"
                role="listbox"
                aria-multiselectable="true"
              >
                {/* Search inside dropdown */}
                <div className="p-2 border-b border-border">
                  <Input
                    value={deptSearch}
                    onChange={(e) => setDeptSearch(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    placeholder="Search departments & roles..."
                    className="h-8 text-sm"
                    autoFocus
                  />
                </div>

                {/* Select All */}
                <div className="p-1">
                  <label
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent text-sm font-medium select-none"
                    htmlFor="emp-dept-select-all"
                  >
                    <input
                      id="emp-dept-select-all"
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="h-4 w-4 rounded border-input accent-primary"
                    />
                    Select All
                    {allDepartments.length > 0 && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {allDepartments.length}
                      </span>
                    )}
                  </label>
                </div>

                <div className="border-t border-border" />

                {/* Department list */}
                <div className="max-h-56 overflow-y-auto p-1 space-y-0.5">
                  {filteredDeptOptions.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-3">
                      No departments match &quot;{deptSearch}&quot;
                    </p>
                  ) : (
                    filteredDeptOptions.map((dept) => {
                      const count = allEmployees.filter(
                        (e) => e.department === dept || e.job_title === dept,
                      ).length;
                      return (
                        <label
                          key={dept}
                          htmlFor={`emp-dept-${dept}`}
                          className="flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent text-sm select-none"
                        >
                          <input
                            id={`emp-dept-${dept}`}
                            type="checkbox"
                            checked={selectedDepts.includes(dept)}
                            onChange={() => toggleDept(dept)}
                            className="h-4 w-4 rounded border-input accent-primary"
                          />
                          <span className="flex-1 truncate">{dept}</span>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {count}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>

                {/* Clear Filter footer */}
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

          {/* Inline clear all button */}
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground hover:text-destructive gap-1.5 px-2"
              onClick={() => {
                clearFilter();
              }}
            >
              <X className="h-3 w-3" />
              Clear all
            </Button>
          )}
        </div>

        {/* Active filter chips */}
        {selectedDepts.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border">
            {selectedDepts.map((dept) => (
              <span
                key={dept}
                className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-0.5"
              >
                {dept}
                <button
                  type="button"
                  className="hover:text-destructive transition-colors"
                  onClick={() => toggleDept(dept)}
                  aria-label={`Remove ${dept} filter`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {selectedDepts.length > 1 && (
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-destructive transition-colors underline underline-offset-2 px-1"
                onClick={clearFilter}
              >
                Clear all
              </button>
            )}
          </div>
        )}
      </Card>

      <Card className="shadow-card border-border/60 overflow-hidden flex flex-col">
        <div className="overflow-auto max-h-[calc(100vh-320px)] min-h-[300px] relative">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background shadow-[0_1px_0_0_hsl(var(--border))]">
              <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-sm text-muted-foreground">
                    Loading employees...
                  </TableCell>
                </TableRow>
              )}
              {isError && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-sm text-destructive">
                    Unable to load employees.
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && !isError && visibleEmployees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-sm text-muted-foreground">
                    {hasFilters
                      ? "No employees match the selected filters."
                      : "No employees found."}
                  </TableCell>
                </TableRow>
              )}
              {visibleEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">
                    {employee.first_name} {employee.last_name}
                  </TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {employee.employee_id}
                  </TableCell>
                  <TableCell>{employee.job_title ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </AppLayout>
  );
}
