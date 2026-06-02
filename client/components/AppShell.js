"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BriefcaseBusiness, ChartBar, GitBranch, LayoutDashboard, LogOut, Menu, Sparkles, Users, X } from "lucide-react";
import { toast } from "sonner";
import { clearToken, getToken } from "../lib/api.js";
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
          <button
            key={href}
            type="button"
            onClick={() => onNavigate?.(href)}
            className={`flex h-9 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition ${active ? "bg-teal-700 text-white shadow-sm" : "text-slate-600 hover:bg-teal-50 hover:text-teal-800"}`}
          >
            <Icon size={15} /> {label}
          </button>
        );
      })}
    </nav>
  );
}

export default function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    if (!getToken()) router.replace("/login");
    else setReady(true);
  }, [router]);

  useEffect(() => {
    setNavigating(false);
  }, [pathname]);

  function handleNavigate(href) {
    setOpen(false);
    if (href === pathname) return;
    setNavigating(true);
    router.push(href);
  }

  function logout() {
    clearToken();
    toast.success("Logged out");
    router.replace("/login");
  }

  if (!ready) return <PageLoader label="Loading recruiter session..." className="min-h-screen" />;

  return (
    <div className="min-h-screen bg-[#f4f7f7]">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-4 md:px-8">
          <Link href="/dashboard" onClick={(event) => { event.preventDefault(); handleNavigate("/dashboard"); }} className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-teal-700 text-white"><Sparkles size={18} /></span>
            <span>
              <span className="block text-base font-semibold leading-5 text-slate-950">AgentHire</span>
              <span className="hidden text-xs text-slate-500 sm:block">Recruiter Console</span>
            </span>
          </Link>
          <div className="hidden items-center gap-3 md:flex">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">AI workflow online</span>
            <Button variant="ghost" onClick={logout}><LogOut size={16} />Logout</Button>
          </div>
          <Button variant="ghost" className="px-2 md:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={20} /></Button>
        </div>
      </header>

      <aside className="fixed bottom-0 left-0 top-16 hidden w-60 border-r border-slate-200 bg-white md:block">
        <div className="flex h-full flex-col p-3">
          <div className="mb-4 rounded-md border border-teal-100 bg-teal-50 px-3 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-teal-700">Workspace</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">Recruitment Ops</p>
          </div>
          <NavLinks pathname={pathname} onNavigate={handleNavigate} />
          <div className="mt-auto rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-medium text-slate-500">Session</p>
            <Button variant="ghost" className="mt-2 h-9 w-full justify-start px-2" onClick={logout}><LogOut size={15} />Logout</Button>
          </div>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button className="absolute inset-0 bg-slate-950/30" onClick={() => setOpen(false)} aria-label="Close menu" />
          <div className="absolute inset-y-0 left-0 w-72 bg-white p-4 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-semibold">AgentHire</span>
              <Button variant="ghost" className="px-2" onClick={() => setOpen(false)} aria-label="Close menu"><X size={18} /></Button>
            </div>
            <NavLinks pathname={pathname} onNavigate={handleNavigate} />
            <Button variant="outline" className="mt-6 w-full" onClick={logout}><LogOut size={16} />Logout</Button>
          </div>
        </div>
      )}

      <main className="relative min-h-[calc(100vh-4rem)] md:pl-60">
        {navigating && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#f4f7f7]/75 backdrop-blur-[1px]">
            <PageLoader label="Loading page..." className="min-h-0 rounded-md border border-slate-200 bg-white px-8 py-6 shadow-sm" />
          </div>
        )}
        <div className={`mx-auto max-w-7xl p-4 transition-opacity md:p-8 ${navigating ? "opacity-40" : "opacity-100"}`}>{children}</div>
      </main>
    </div>
  );
}
