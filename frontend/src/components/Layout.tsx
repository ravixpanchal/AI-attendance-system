import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Upload,
  MessageSquare,
  Download,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

const nav = [
  { id: "dash", label: "Dashboard", icon: LayoutDashboard },
  { id: "students", label: "Students", icon: Users },
  { id: "attendance", label: "Attendance", icon: Calendar },
  { id: "upload", label: "Upload", icon: Upload },
  { id: "ai", label: "AI Assistant", icon: MessageSquare },
  { id: "export", label: "Export", icon: Download },
] as const;

export type Tab = (typeof nav)[number]["id"];

function NavButtons({
  tab,
  onTab,
  onNavigate,
}: {
  tab: Tab;
  onTab: (t: Tab) => void;
  onNavigate?: () => void;
}) {
  return (
    <>
      {nav.map((n) => (
        <button
          key={n.id}
          type="button"
          onClick={() => {
            onTab(n.id);
            onNavigate?.();
          }}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
            tab === n.id
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <n.icon className="h-4 w-4 shrink-0" />
          {n.label}
        </button>
      ))}
    </>
  );
}

export function Layout({
  tab,
  onTab,
  onLogout,
  dark,
  onToggleTheme,
  children,
}: {
  tab: Tab;
  onTab: (t: Tab) => void;
  onLogout: () => void;
  dark: boolean;
  onToggleTheme: () => void;
  children: ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const close = () => {
      if (mq.matches) setDrawerOpen(false);
    };
    mq.addEventListener("change", close);
    return () => mq.removeEventListener("change", close);
  }, []);

  useEffect(() => {
    if (drawerOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  return (
    <div className="min-h-screen bg-background md:flex">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-card/90 px-4 backdrop-blur-md md:hidden">
        <span className="truncate font-semibold tracking-tight">Smart Attendance</span>
        <button
          type="button"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-muted"
          aria-expanded={drawerOpen}
          aria-label="Open menu"
          onClick={() => setDrawerOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile drawer + overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden",
          drawerOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
        aria-hidden={!drawerOpen}
      >
        <button
          type="button"
          className={cn(
            "absolute inset-0 bg-black/50 transition-opacity",
            drawerOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setDrawerOpen(false)}
          aria-label="Close menu"
        />
        <aside
          className={cn(
            "absolute left-0 top-0 flex h-full w-[min(18rem,calc(100vw-2.5rem))] max-w-full flex-col border-r border-border bg-card p-4 shadow-xl transition-transform duration-200 ease-out",
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="mb-4 flex items-center justify-between">
            <span className="font-semibold">Menu</span>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
            <NavButtons tab={tab} onTab={onTab} onNavigate={() => setDrawerOpen(false)} />
          </nav>
          <div className="mt-4 space-y-1 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => {
                onToggleTheme();
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {dark ? "Light mode" : "Dark mode"}
            </button>
            <button
              type="button"
              onClick={() => {
                onLogout();
                setDrawerOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </aside>
      </div>

      {/* Desktop sidebar */}
      <aside className="relative z-20 hidden w-56 shrink-0 flex-col border-r border-border bg-card/80 p-4 backdrop-blur-sm md:flex">
        <div className="mb-4 px-1 font-semibold tracking-tight">Smart Attendance</div>
        <nav className="flex flex-1 flex-col gap-1">
          <NavButtons tab={tab} onTab={onTab} />
        </nav>
        <div className="mt-auto space-y-1 border-t border-border pt-4">
          <button
            type="button"
            onClick={onToggleTheme}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {dark ? "Light" : "Dark"}
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 hover:bg-red-500/10"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <main className="min-h-[calc(100vh-3.5rem)] w-full min-w-0 flex-1 px-4 py-5 sm:px-6 md:min-h-screen md:p-8">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
