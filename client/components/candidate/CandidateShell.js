"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, BriefcaseBusiness, CalendarClock, LayoutDashboard, LogOut, Menu, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { api, clearToken, getToken } from "../../lib/api.js";
import { Button } from "../ui/Button.js";
import { PageLoader } from "../ui/PageLoader.js";

let candidateSessionVerified = false;

const items = [
  ["/candidate/dashboard", "Applications", LayoutDashboard],
  ["/candidate/jobs", "Jobs", BriefcaseBusiness],
  ["/candidate/interviews", "Interviews", CalendarClock],
  ["/candidate/notifications", "Notifications", Bell]
];

function NavLinks({ pathname, navigate }) {
  return (
    <nav className="space-y-1.5">
      {items.map(([href, label, Icon]) => {
        const active = href === "/candidate/dashboard" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => navigate()}
            className={`flex h-9 w-full cursor-pointer items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition ${active ? "bg-teal-700 text-white shadow-sm" : "text-slate-600 hover:bg-teal-50 hover:text-teal-800"}`}
          >
            <Icon size={15} /> {label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function CandidateShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const [open, setOpen] = useState(false);
  const isAuthPage = pathname === "/candidate/login" || pathname === "/candidate/signup";

  useEffect(() => {
    if (isAuthPage) return undefined;

    function handleSessionExpired() {
      candidateSessionVerified = false;
      clearToken();
      router.replace("/candidate/login");
    }

    window.addEventListener("agenthire:session-expired", handleSessionExpired);

    if (candidateSessionVerified && getToken()) {
      setReady(true);
      return () => window.removeEventListener("agenthire:session-expired", handleSessionExpired);
    }

    let mounted = true;
    const timeout = window.setTimeout(() => {
      if (mounted) {
        setSessionError("Candidate session check is taking too long. Please refresh or log in again.");
      }
    }, 8000);

    async function verify() {
      if (!getToken()) {
        router.replace("/candidate/login");
        return;
      }
      try {
        await api("/candidate/auth/me");
        if (mounted) {
          window.clearTimeout(timeout);
          candidateSessionVerified = true;
          setReady(true);
        }
      } catch (error) {
        window.clearTimeout(timeout);
        clearToken();
        if (mounted) setSessionError(error.message || "Candidate session expired.");
        router.replace("/candidate/login");
      }
    }
    verify();
    return () => {
      mounted = false;
      window.clearTimeout(timeout);
      window.removeEventListener("agenthire:session-expired", handleSessionExpired);
    };
  }, [isAuthPage, router]);

  function navigate() {
    setOpen(false);
  }

  function logout() {
    candidateSessionVerified = false;
    clearToken();
    toast.success("Logged out");
    router.replace("/candidate/login");
  }

  if (isAuthPage) return children;

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f7f7] p-6" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f7f7", padding: 24 }}>
        <div className="rounded-md border border-slate-200 bg-white p-6 text-center shadow-sm" style={{ maxWidth: 420, border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", padding: 24, textAlign: "center", boxShadow: "0 1px 2px rgba(15,23,42,.08)" }}>
          <PageLoader label="Loading candidate portal..." className="min-h-0" />
          {sessionError && (
            <div className="mt-4">
              <p className="text-sm text-red-700" style={{ color: "#b91c1c", fontSize: 14 }}>{sessionError}</p>
              <Button className="mt-3" onClick={() => router.replace("/candidate/login")}>Go to login</Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7f7]">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-4 md:px-8">
          <Link href="/candidate/dashboard" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-teal-700 text-white"><Sparkles size={18} /></span>
            <span>
              <span className="block text-base font-semibold leading-5 text-slate-950">AgentHire</span>
              <span className="hidden text-xs text-slate-500 sm:block">Candidate Portal</span>
            </span>
          </Link>
          <div className="hidden items-center gap-3 md:flex">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">Tracking enabled</span>
            <Button variant="ghost" onClick={logout}><LogOut size={16} />Logout</Button>
          </div>
          <Button variant="ghost" className="px-2 md:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={20} /></Button>
        </div>
      </header>

      <aside className="fixed bottom-0 left-0 top-16 z-40 hidden w-60 border-r border-slate-200 bg-white md:block">
        <div className="flex h-full flex-col p-3">
          <div className="mb-4 rounded-md border border-teal-100 bg-teal-50 px-3 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-teal-700">Portal</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-950"><BriefcaseBusiness size={15} /> Applications</p>
          </div>
          <NavLinks pathname={pathname} navigate={navigate} />
          <Button variant="ghost" className="mt-auto h-9 w-full justify-start px-2" onClick={logout}><LogOut size={15} />Logout</Button>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button className="absolute inset-0 bg-slate-950/30" onClick={() => setOpen(false)} aria-label="Close menu" />
          <div className="absolute inset-y-0 left-0 w-72 bg-white p-4 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-semibold">Candidate Portal</span>
              <Button variant="ghost" className="px-2" onClick={() => setOpen(false)} aria-label="Close menu"><X size={18} /></Button>
            </div>
            <NavLinks pathname={pathname} navigate={navigate} />
            <Button variant="outline" className="mt-6 w-full" onClick={logout}><LogOut size={16} />Logout</Button>
          </div>
        </div>
      )}

      <main className="min-h-[calc(100vh-4rem)] md:pl-60">
        <div className="mx-auto max-w-7xl p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
