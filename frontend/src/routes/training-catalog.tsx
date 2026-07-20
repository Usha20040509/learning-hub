import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getTrainingCatalog } from "@/lib/api";
import type { TrainingCatalogRead } from "@/lib/types";

export const Route = createFileRoute("/training-catalog")({
  head: () => ({
    meta: [
      { title: "Training Catalog — Learning Hub" },
      { name: "description", content: "Browse company training courses, categories, and descriptions." },
    ],
  }),
  component: TrainingCatalogPage,
});

function TrainingCatalogPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["trainingCatalog", search],
    queryFn: () => getTrainingCatalog({ page: 1, page_size: 100, search: search || undefined }),
  });

  const catalogItems = data?.items ?? [];

  return (
    <AppLayout>
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Training Catalog</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Explore training courses and learning paths available for your team.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{catalogItems.length} catalog items</Badge>
        </div>
      </div>

      <Card className="p-4 shadow-card border-border/60 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search training catalog..." className="pl-9" />
        </div>
      </Card>

      <Card className="shadow-card border-border/60 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                <TableHead>Code</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {catalogItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-sm text-muted-foreground">
                    {isLoading ? "Loading catalog..." : isError ? "Unable to load training catalog." : "No training catalog items found."}
                  </TableCell>
                </TableRow>
              )}
              {catalogItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.code}</TableCell>
                  <TableCell>{item.title}</TableCell>
                  <TableCell>{item.category ?? "General"}</TableCell>
                  <TableCell>{item.duration_hours != null ? `${item.duration_hours}h` : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </AppLayout>
  );
}
