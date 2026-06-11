"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BriefcaseBusiness, ChartBar, GitBranch, LayoutDashboard, LogOut, Menu, Sparkles, UserRound, Users, X } from "lucide-react";
import { toast } from "sonner";
import { api, clearToken, getToken } from "../lib/api.js";
import { useAuthStore } from "../store/authStore.js";
import { Button } from "./ui/Button.js";
import { PageLoader } from "./ui/PageLoader.js";

const items = [
  ["/dashboard", "Overview", LayoutDashboard],
  ["/dashboard/jobs", "Jobs", BriefcaseBusiness],
  ["/dashboard/candidates", "Candidates", Users],
  ["/dashboard/workflows", "Workflows", GitBranch],
  ["/dashboard/analytics", "Analytics", ChartBar]
];

function NavLinks({ pathname, onNavigate }) {
  return (
    <nav className="space-y-1.5">
      {items.map(([href, label, Icon]) => {
        const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={(event) => onNavigate?.(href, event)}
            className={`flex h-9 w-full cursor-pointer items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition ${active ? "bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg" : "text-slate-300 hover:bg-slate-700/50 hover:text-white"}`}
          >
            <Icon size={15} /> {label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const cachedUser = useAuthStore((state) => state.user);
  const clearAuthState = useAuthStore((state) => state.logout);
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(cachedUser);
  const [open, setOpen] = useState(false);
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    let mounted = true;
    router.prefetch("/login");

    function handleSessionExpired() {
      clearToken();
      router.replace("/login");
    }

    async function verify() {
      if (!getToken()) {
        router.replace("/login");
        return;
      }
      if (cachedUser && ["recruiter", "admin"].includes(cachedUser.role)) {
        setUser(cachedUser);
        setReady(true);
        return;
      }
      try {
        const data = await api("/auth/me");
        if (mounted) {
          setUser(data.user);
          setReady(true);
        }
      } catch {
        clearToken();
        router.replace("/login");
      }
    }

    window.addEventListener("agenthire:session-expired", handleSessionExpired);
    verify();
    return () => {
      mounted = false;
      window.removeEventListener("agenthire:session-expired", handleSessionExpired);
    };
  }, [cachedUser, router]);

  useEffect(() => {
    setNavigating(false);
  }, [pathname]);

  function handleNavigate(href, event) {
    setOpen(false);
    if (href === pathname) {
      event?.preventDefault();
      return;
    }
    setNavigating(true);
  }

  function logout() {
    setNavigating(true);
    clearAuthState();
    toast.success("Logged out");
    router.replace("/login");
  }

  if (!ready) return <PageLoader label="Loading recruiter session..." className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white" />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-indigo-50">
      <header className="sticky top-0 z-40 border-b border-slate-700/50 bg-gradient-to-b from-slate-900 to-slate-800 backdrop-blur-sm">
        <div className="flex h-16 items-center justify-between px-3 sm:px-4 md:px-8">
          <Link href="/dashboard" onClick={(event) => { event.preventDefault(); handleNavigate("/dashboard"); }} className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg"><Sparkles size={18} /></span>
            <span>
              <span className="block text-base font-semibold leading-5 text-white">AgentHire</span>
              <span className="hidden text-xs text-slate-400 sm:block">Recruiter Console</span>
            </span>
          </Link>
          <div className="hidden items-center gap-3 md:flex">
            <span className="rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-medium text-teal-300">AI workflow online</span>
            <div className="flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-800/70 py-1 pl-1 pr-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 text-xs font-bold text-white">
                {(user?.name || "R").slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0">
                <span className="block max-w-36 truncate text-sm font-semibold leading-4 text-white">{user?.name || "Recruiter"}</span>
                <span className="block text-xs capitalize leading-4 text-slate-400">{user?.role || "recruiter"}</span>
              </span>
            </div>
            <Button variant="ghost" className="text-slate-200 hover:bg-slate-700/50 hover:text-white" onClick={logout}><LogOut size={16} />Logout</Button>
          </div>
          <Button variant="ghost" className="px-2 text-slate-200 hover:bg-slate-700/50 hover:text-white md:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={20} /></Button>
        </div>
      </header>

      <aside className="fixed bottom-0 left-0 top-16 z-40 hidden w-60 border-r border-slate-700/50 bg-slate-900/95 backdrop-blur md:block">
        <div className="flex h-full flex-col p-3">
          <div className="mb-4 rounded-md border border-teal-500/30 bg-teal-500/10 px-3 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-teal-300">Workspace</p>
            <p className="mt-1 text-sm font-semibold text-white">Recruitment Ops</p>
          </div>
          <NavLinks pathname={pathname} onNavigate={handleNavigate} />
          <div className="mt-auto rounded-md border border-slate-700/50 bg-slate-800/50 p-3">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 text-xs font-bold text-white">
                {(user?.name || "R").slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{user?.name || "Recruiter"}</p>
                <p className="text-xs capitalize text-slate-400">{user?.role || "recruiter"}</p>
              </span>
            </div>
            <Button variant="ghost" className="mt-2 h-9 w-full justify-start px-2 text-slate-200 hover:bg-slate-700/50 hover:text-white" onClick={logout}><LogOut size={15} />Logout</Button>
          </div>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button className="absolute inset-0 bg-slate-950/30" onClick={() => setOpen(false)} aria-label="Close menu" />
          <div className="absolute inset-y-0 left-0 w-[min(18rem,85vw)] bg-slate-900 p-4 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex min-w-0 items-center gap-2">
                <UserRound size={17} className="text-teal-300" />
                <span className="truncate font-semibold text-white">{user?.name || "Recruiter"}</span>
              </div>
              <Button variant="ghost" className="px-2 text-slate-200 hover:bg-slate-700/50 hover:text-white" onClick={() => setOpen(false)} aria-label="Close menu"><X size={18} /></Button>
            </div>
            <NavLinks pathname={pathname} onNavigate={handleNavigate} />
            <Button variant="outline" className="mt-6 w-full border-slate-600 text-slate-200 hover:bg-slate-700/50 hover:text-white" onClick={logout}><LogOut size={16} />Logout</Button>
          </div>
        </div>
      )}

      <main className="relative min-h-[calc(100vh-4rem)] md:pl-60">
        {navigating && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/45 backdrop-blur-[1px]">
            <PageLoader label="Loading page..." className="min-h-0 rounded-md border border-slate-200 bg-white px-8 py-6 shadow-sm" />
          </div>
        )}
        <div className={`mx-auto max-w-7xl p-3 transition-opacity sm:p-4 md:p-8 ${navigating ? "opacity-40" : "opacity-100"}`}>{children}</div>
      </main>
    </div>
  );
}
