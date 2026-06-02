"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BriefcaseBusiness, ChartBar, GitBranch, LayoutDashboard, Users } from "lucide-react";
import { getToken } from "../lib/api.js";

const items = [
  ["/dashboard", "Overview", LayoutDashboard],
  ["/dashboard/jobs", "Jobs", BriefcaseBusiness],
  ["/dashboard/candidates", "Candidates", Users],
  ["/dashboard/workflows", "Workflows", GitBranch],
  ["/dashboard/analytics", "Analytics", ChartBar]
];

export default function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) router.replace("/login");
    else setReady(true);
  }, [router]);

  if (!ready) return <main className="p-8 text-sm text-slate-600">Loading recruiter session...</main>;

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white p-4 md:block">
        <Link href="/dashboard" className="mb-8 block text-xl font-semibold">AgentHire</Link>
        <nav className="space-y-1">
          {items.map(([href, label, Icon]) => (
            <Link key={href} href={href} className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${pathname === href ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-slate-100"}`}>
              <Icon size={16} /> {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="md:pl-64">
        <div className="mx-auto max-w-7xl p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
