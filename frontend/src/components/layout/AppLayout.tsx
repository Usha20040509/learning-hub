import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  PlusCircle,
  UserCircle2,
  Users,
  GraduationCap,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";
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

  return (
    <div className="flex min-h-screen w-full bg-app">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-sidebar">
        <div className="flex items-center gap-2 px-5 h-16 border-b border-border">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-soft">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold leading-tight">Learning Hub</div>
            <div className="text-xs text-muted-foreground">Internal Portal</div>
          </div>
        </div>
        <nav className="flex-1 py-4 space-y-1">
          {navItems.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to as never}
                className={cn(
                  "flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-all border-l-4",
                  active
                    ? "border-primary bg-primary/5 text-primary font-semibold"
                    : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <div className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 p-3 text-xs">
            <div className="font-semibold text-foreground">Need help?</div>
            <div className="text-muted-foreground mt-0.5">
              Check the Learning Hub guide.
            </div>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b border-border bg-background sticky top-0 z-40">
          <div className="h-full px-4 md:px-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="md:hidden grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="h-5 w-5" />
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive" />
              </Button>
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
                  <DropdownMenuItem onSelect={() => navigate({ to: "/profile" })}>
                    Preferences
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
