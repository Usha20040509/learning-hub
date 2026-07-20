import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Filter } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getEmployees } from "@/lib/api";
import type { EmployeeRead } from "@/lib/types";
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
  const [activeOnly, setActiveOnly] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["employees", search, selectedDepts, activeOnly],
    queryFn: () =>
      getEmployees({
        page: 1,
        page_size: 100,
        search: search || undefined,
        department: selectedDepts.length > 0 ? selectedDepts.join(",") : undefined,
        is_active: activeOnly ? true : undefined,
      }),
    keepPreviousData: true,
  });

  const employees = data?.items ?? [];
  const departments = useMemo(
    () => Array.from(new Set(employees.map((item) => item.department).filter(Boolean))) as string[],
    [employees],
  );

  const filteredDepartments = useMemo(() => {
    return departments.filter(d => d.toLowerCase().includes(deptSearch.toLowerCase()));
  }, [departments, deptSearch]);

  return (
    <AppLayout>
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
          <p className="text-sm text-muted-foreground mt-0.5">View employee contact details, departments, and active status.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{employees.length} employees</Badge>
        </div>
      </div>

      <Card className="p-4 shadow-card border-border/60 mb-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email, or department..."
              className="pl-9"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9 gap-2 justify-start font-normal text-muted-foreground w-full sm:w-[200px]">
                <Filter className="h-4 w-4" />
                {selectedDepts.length > 0 ? `${selectedDepts.length} departments selected` : "All departments"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px] p-0">
              <div className="p-2">
                <Input
                  value={deptSearch}
                  onChange={(e) => setDeptSearch(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder="Search"
                  className="h-8 text-sm"
                />
              </div>
              <DropdownMenuSeparator className="m-0" />
              <div className="max-h-60 overflow-y-auto p-1 space-y-0.5">
                <DropdownMenuCheckboxItem
                  checked={selectedDepts.length === departments.length && departments.length > 0}
                  onCheckedChange={(checked) => {
                    setSelectedDepts(checked ? departments : []);
                  }}
                  className="text-sm font-medium"
                >
                  (Select All)
                </DropdownMenuCheckboxItem>
                {filteredDepartments.map((dept) => (
                  <DropdownMenuCheckboxItem
                    key={dept}
                    checked={selectedDepts.includes(dept)}
                    onCheckedChange={(checked) => {
                      setSelectedDepts((prev) =>
                        checked ? [...prev, dept] : prev.filter((d) => d !== dept)
                      );
                    }}
                  >
                    {dept}
                  </DropdownMenuCheckboxItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(event) => setActiveOnly(event.target.checked)}
              className="h-4 w-4 rounded border-input text-primary"
            />
            Active only
          </label>
        </div>
      </Card>

      <Card className="shadow-card border-border/60 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                    {isLoading ? "Loading employees..." : isError ? "Unable to load employees." : "No employees found."}
                  </TableCell>
                </TableRow>
              )}
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">
                    {employee.first_name} {employee.last_name}
                  </TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>{employee.department ?? "—"}</TableCell>
                  <TableCell>{employee.job_title ?? "—"}</TableCell>
                  <TableCell>
                    <span className={cn(
                      "inline-flex rounded-full px-2 py-1 text-xs font-medium",
                      employee.is_active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600",
                    )}>
                      {employee.is_active ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </AppLayout>
  );
}
