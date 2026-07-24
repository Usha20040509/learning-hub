import { format } from "date-fns";
import { CheckCircle2, XCircle, Clock, Search, ExternalLink, Calendar as CalendarIcon, User, Layers, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getEmployeeStats } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function EmployeeDetailsDialog({
  employeeId,
  open,
  onOpenChange,
}: {
  employeeId: number | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [activeTab, setActiveTab] = useState("session-details");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: stats, isLoading } = useQuery({
    queryKey: ["employee-stats", employeeId],
    queryFn: () => employeeId ? getEmployeeStats(employeeId) : Promise.reject("No ID"),
    enabled: !!employeeId && open,
  });

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  const filteredSessions = (stats?.sessions || []).filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        {!stats && isLoading ? (
          <div className="p-12 text-center text-muted-foreground">Loading employee data...</div>
        ) : !stats ? (
          <div className="p-12 text-center text-muted-foreground">Employee data not found.</div>
        ) : (
          <div className="flex flex-col">
            {/* Header section */}
            <DialogHeader className="p-6 pb-4 border-b border-border/60">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16 bg-red-100 text-red-700">
                  <AvatarFallback className="text-xl font-bold bg-red-100 text-red-700">{getInitials(stats.employee_name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    {stats.employee_name}
                  </h2>
                  <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                    <span>{stats.employee_title || "Employee"}</span>
                    {stats.employee_group && (
                      <>
                        <span>•</span>
                        <span>{stats.employee_group}</span>
                      </>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex gap-4">
                    <span>Employee ID: {stats.employee_id}</span>
                    <span>Email: {stats.employee_email}</span>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="border border-border/60 rounded-xl p-4 text-center shadow-sm">
                  <div className="text-xs font-semibold text-muted-foreground mb-1">Attendance</div>
                  <div className="text-2xl font-bold">{stats.attendance_percentage}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">{stats.sessions_attended} / {stats.total_sessions} Sessions</div>
                </div>
                <div className="border border-border/60 rounded-xl p-4 text-center shadow-sm">
                  <div className="text-xs font-semibold text-muted-foreground mb-1">Sessions Attended</div>
                  <div className="text-2xl font-bold">{stats.sessions_attended}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">of {stats.total_sessions} total</div>
                </div>
                <div className="border border-border/60 rounded-xl p-4 text-center shadow-sm">
                  <div className="text-xs font-semibold text-muted-foreground mb-1">Assignments Submitted</div>
                  <div className="text-2xl font-bold">{stats.assignments_submitted}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">of {stats.total_assignments}</div>
                </div>
              </div>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="px-6 pt-2 border-b border-border/60">
                <TabsList className="bg-transparent border-b-0 h-auto p-0 space-x-6">
                  <TabsTrigger 
                    value="session-details" 
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 pt-2 text-sm font-semibold"
                  >
                    Session Details
                  </TabsTrigger>
                  <TabsTrigger 
                    value="summary" 
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 pt-2 text-sm font-semibold"
                  >
                    Summary
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="session-details" className="p-0 m-0">
                <div className="px-6 py-4 flex items-center justify-between border-b border-border/60 bg-secondary/20">
                  <div className="relative max-w-sm w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search sessions..." 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-9 h-9 text-sm bg-white"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-secondary/30">
                      <tr className="border-b border-border/60 text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">
                        <th className="py-3 px-6">Session</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4">Attendance</th>
                        <th className="py-3 px-4">Assignment</th>
                        <th className="py-3 px-4"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSessions.map((session) => (
                        <tr key={session.id} className="border-b border-border/40 hover:bg-secondary/20 transition-colors">
                          <td className="py-3 px-6">
                            <div className="font-semibold text-foreground flex items-center gap-2">
                              {session.event_type === "training" ? <Layers className="h-4 w-4 text-blue-500" /> : <CalendarIcon className="h-4 w-4 text-orange-500" />}
                              {session.title}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5 ml-6 line-clamp-1">{session.description || session.event_type}</div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="text-foreground font-medium">{format(new Date(session.start_time), "MMM d, yyyy")}</div>
                            <div className="text-xs text-muted-foreground">{format(new Date(session.start_time), "h:mm a")} - {format(new Date(session.end_time), "h:mm a")}</div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium border", 
                              session.status === "Completed" ? "bg-green-50 text-green-700 border-green-200" : "bg-blue-50 text-blue-700 border-blue-200"
                            )}>
                              {session.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {session.status === "Completed" ? (
                              <div className="flex flex-col">
                                <div className={cn("flex items-center gap-1.5 font-medium text-xs", session.attended ? "text-green-600" : "text-destructive")}>
                                  {session.attended ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                                  {session.attendance_status}
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground">Not scheduled</div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {!session.assignment_included ? (
                              <div className="text-xs text-muted-foreground">—</div>
                            ) : session.status === "Completed" ? (
                              <div className="flex flex-col">
                                <div className={cn("flex items-center gap-1.5 font-medium text-xs", session.assignment_submitted ? "text-green-600" : "text-amber-600")}>
                                  {session.assignment_submitted ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                                  {session.assignment_status}
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground">Not available</div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <ArrowRight className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer ml-auto" />
                          </td>
                        </tr>
                      ))}
                      {filteredSessions.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-muted-foreground text-sm">
                            No sessions found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                <div className="p-4 bg-red-50/50 text-xs text-muted-foreground border-t border-border/60 flex gap-2 items-start">
                  <div className="w-4 h-4 rounded-full border border-red-200 flex items-center justify-center text-[10px] text-red-500 font-bold shrink-0 mt-0.5">i</div>
                  <p>Attendance is marked when you join the session. Assignment is marked when you submit before the due date.</p>
                </div>
              </TabsContent>
              
              <TabsContent value="summary" className="p-6 min-h-[300px]">
                <div className="text-sm text-muted-foreground text-center pt-10">
                  Summary view is under construction.
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
