import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  PlusCircle,
  UserCircle2,
  Users,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { clearCurrentUser, getCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Search, Bell } from "lucide-react";

const nav: { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/events", label: "Events", icon: BookOpen },
  { to: "/create-event", label: "Create Event", icon: PlusCircle },
  { to: "/my-sessions", label: "My Sessions", icon: UserCircle2 },
  { to: "/employees", label: "Employees", icon: Users },
  { to: "/teams", label: "Teams", icon: GraduationCap },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const user = getCurrentUser();
  const authenticated = Boolean(user);
  const navItems = authenticated
    ? nav
    : [...nav, { to: "/login", label: "Login", icon: UserCircle2 }];
  const initials = user
    ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.trim().toUpperCase() || "GH"
    : "GH";

  useEffect(() => {
    if (pathname !== "/login" && !authenticated) {
      navigate({ to: "/login" });
    } else if (pathname === "/login" && authenticated) {
      navigate({ to: "/" });
    }
  }, [pathname, authenticated, navigate]);

  const { data: summary } = useQuery({
    queryKey: ["dashboard", user?.id],
    queryFn: () => getDashboardSummary(user!.id),
    enabled: authenticated && !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const notifications = useMemo(() => {
    const list: Array<{ id: string; title: string; message: string; time: string }> = [];
    if (!summary) return list;

    summary.upcoming_sessions?.forEach((session: any) => {
      list.push({
        id: `invite-${session.id}`,
        title: "Session Invite",
        message: `You are invited to ${session.title}`,
        time: format(new Date(session.start_time), "MMM d"),
      });
    });

    summary.assignments?.forEach((assignment: any) => {
      if (assignment.status === "Pending") {
        list.push({
          id: `assignment-${assignment.id}`,
          title: "Pending Assignment",
          message: assignment.title,
          time: assignment.due,
        });
      }
    });

    return list;
  }, [summary]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-app">
      {/* Sidebar */}
      <aside className={cn("hidden md:flex shrink-0 flex-col border-r border-border bg-sidebar transition-all duration-300", collapsed ? "w-[72px]" : "w-64")}>
        <div className={cn("flex items-center h-16 border-b border-border transition-all duration-300", collapsed ? "justify-center px-0" : "gap-2 px-5")}>
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-soft">
            <GraduationCap className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1 overflow-hidden animate-in fade-in duration-300">
              <div className="text-sm font-semibold leading-tight truncate">Learning Hub</div>
              <div className="text-xs text-muted-foreground truncate">Internal Portal</div>
            </div>
          )}
        </div>
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to as never}
                className={cn(
                  "flex items-center text-sm font-medium transition-all border-l-4 overflow-hidden",
                  collapsed ? "justify-center px-0 py-3 mx-2 rounded-md border-l-0" : "gap-3 px-5 py-2.5",
                  active
                    ? (collapsed ? "bg-primary/10 text-primary font-semibold" : "border-primary bg-primary/5 text-primary font-semibold")
                    : (collapsed ? "text-muted-foreground hover:bg-accent hover:text-foreground" : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground"),
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={cn("shrink-0", collapsed ? "h-5 w-5" : "h-4 w-4")} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className={cn("mt-auto p-4 border-t border-border flex", collapsed ? "justify-center px-2" : "justify-end")}>
          <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Topbar */}
        <header className="h-16 border-b border-border bg-background sticky top-0 z-40">
          <div className="h-full px-4 md:px-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="md:hidden grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="h-5 w-5" />
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {authenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative hover:bg-accent">
                      <Bell className="h-4 w-4" />
                      {notifications.length > 0 && (
                        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive shadow-sm" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden">
                    <div className="bg-muted/50 px-3 py-2 border-b border-border">
                      <DropdownMenuLabel className="p-0 text-sm font-semibold">Notifications</DropdownMenuLabel>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-muted-foreground">
                        No new notifications
                      </div>
                    ) : (
                      <div className="max-h-[300px] overflow-y-auto">
                        {notifications.map((n) => (
                          <div key={n.id} className="flex flex-col items-start gap-1 p-3 border-b border-border/50 hover:bg-accent/50 transition-colors last:border-0">
                            <div className="flex items-center gap-2 w-full">
                              <span className="text-xs font-bold text-primary">{n.title}</span>
                              <span className="text-[10px] font-medium text-muted-foreground ml-auto whitespace-nowrap bg-muted px-1.5 py-0.5 rounded-sm">{n.time}</span>
                            </div>
                            <span className="text-sm text-foreground leading-tight">{n.message}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="ghost" size="icon" className="relative disabled:opacity-50" disabled>
                  <Bell className="h-4 w-4" />
                </Button>
              )}
              {authenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent transition-colors">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left hidden sm:block">
                        <div className="text-xs font-semibold leading-tight">
                          {user ? `${user.first_name} ${user.last_name}` : "Guest"}
                        </div>
                        <div className="text-[11px] text-muted-foreground leading-tight">
                          {user?.department ?? "Learning Hub"}
                        </div>
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="text-sm font-semibold">
                        {user ? `${user.first_name} ${user.last_name}` : "Guest"}
                      </div>
                      <div className="text-xs text-muted-foreground font-normal">
                        {user?.email ?? "Not signed in"}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => navigate({ to: "/profile" })}>
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() => {
                        clearCurrentUser();
                        navigate({ to: "/login" });
                      }}
                    >
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-semibold leading-tight">Guest</div>
                    <div className="text-[11px] text-muted-foreground leading-tight">Learning Hub</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile nav */}
        <div className="md:hidden border-b border-border bg-card overflow-x-auto">
          <div className="flex gap-1 p-2">
            {navItems.map((item) => {
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to as never}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap",
                    active ? "bg-primary/10 text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <main className="flex-1 p-4 md:p-8 max-w-[1400px] w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}

export function TypeBadge({ type }: { type: "training" | "workshop" }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent font-medium",
        type === "training"
          ? "bg-primary/10 text-primary"
          : "bg-emerald-50 text-emerald-700",
      )}
    >
      {type === "training" ? "Training" : "Workshop"}
    </Badge>
  );
}
