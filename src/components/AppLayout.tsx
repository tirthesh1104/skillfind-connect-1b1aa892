import { ReactNode, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NotificationBell } from "@/components/NotificationBell";
import { InitialsAvatar } from "@/components/InitialsAvatar";
import {
  HardHat, LayoutDashboard, Users, Briefcase, Inbox, LogOut, Menu,
  UserCircle, Search, ListChecks, Shield, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
}

const NAV: Record<string, NavItem[]> = {
  contractor: [
    { to: "/contractor", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/contractor/find-labour", label: "Find Labour", icon: Search },
    { to: "/contractor/jobs", label: "My Jobs", icon: Briefcase },
    { to: "/contractor/requests", label: "Requests", icon: Inbox },
  ],
  labour: [
    { to: "/labour", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/labour/profile", label: "My Profile", icon: UserCircle },
    { to: "/labour/find-jobs", label: "Find Jobs", icon: Search },
    { to: "/labour/applications", label: "Applications", icon: ListChecks },
  ],
  admin: [
    { to: "/admin", label: "Overview", icon: Shield, end: true },
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/jobs", label: "Jobs", icon: Briefcase },
    { to: "/admin/requests", label: "Requests", icon: FileText },
  ],
};

export const AppLayout = ({ children }: { children: ReactNode }) => {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [profileName, setProfileName] = useState<string>("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle().then(({ data }) => {
      setProfileName(data?.full_name ?? user.email ?? "User");
    });
  }, [user]);

  const items = role ? NAV[role] : [];

  const handleLogout = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="rounded-xl bg-gradient-primary p-2 shadow-glow">
          <HardHat className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight">Labour Connector</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{role}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
                isActive
                  ? "bg-gradient-primary text-white shadow-glow"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
              )
            }
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-sidebar-accent/50 p-2">
          <InitialsAvatar name={profileName} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{profileName}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start text-muted-foreground hover:text-destructive">
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen w-full">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl md:flex">
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 bg-sidebar">
                <div className="flex h-full flex-col">
                  <SidebarContent />
                </div>
              </SheetContent>
            </Sheet>
            <span className="font-semibold">Labour Connector</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 animate-fade-in">{children}</main>
      </div>
    </div>
  );
};
