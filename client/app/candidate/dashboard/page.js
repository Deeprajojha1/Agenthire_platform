"use client";

import Link from "next/link";
import { Bell, ChevronRight, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/Button.js";
import { Input } from "../../../components/ui/Input.js";
import { PageLoader } from "../../../components/ui/PageLoader.js";
import { api } from "../../../lib/api.js";

function formatDate(value) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function statusClass(status) {
  if (["reject", "rejected"].includes(status)) return "border border-rose-200 bg-rose-50 text-rose-700";
  if (["shortlist", "approved", "selected", "hired", "advanced"].includes(status)) return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  return "border border-amber-200 bg-amber-50 text-amber-700";
}

function statusLabel(status) {
  if (status === "hired" || status === "advanced") return "Hired";
  if (status === "rejected" || status === "reject") return "Rejected";
  if (status === "hold") return "On Hold";
  return status;
}

function resultCount(data) {
  return data?.applications?.length || 0;
}

export default function CandidateDashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const metricCards = [
    ["Current Step", "current_step", "from-teal-50 to-cyan-50 border-teal-100 text-teal-700"],
    ["Workflow", "workflow_status", "from-indigo-50 to-violet-50 border-indigo-100 text-indigo-700"],
    ["Match Score", "match_score", "from-amber-50 to-orange-50 border-amber-100 text-amber-700"]
  ];

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
        setData(await api(`/candidate/dashboard${query}`, { signal: controller.signal }));
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [search]);

  return (
    <>
      <div className="rounded-xl border border-teal-100 bg-gradient-to-r from-white/95 via-teal-50/95 to-indigo-50/95 p-4 shadow-sm backdrop-blur sm:sticky sm:top-20 sm:z-30 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-teal-700">Candidate Portal</p>
            <h1 className="mt-1 text-xl font-semibold text-slate-950 sm:text-2xl">Applications</h1>
          </div>
          <Button asChild className="w-full border-indigo-200 bg-white text-slate-900 shadow-sm hover:bg-indigo-50 hover:text-indigo-700 sm:w-auto">
            <Link href="/candidate/notifications"><Bell size={16} />{data?.unread_count || 0} unread</Link>
          </Button>
        </div>

        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-teal-100 bg-white/90 p-3 shadow-sm ring-1 ring-white/70 sm:mt-5 sm:flex-row sm:items-center sm:p-4">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-teal-500" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search applications by student name, email, job title, or status"
              className="border-slate-200 bg-slate-50/70 pl-9 pr-9 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <p className="self-start rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 sm:self-auto">{loading ? "Searching..." : `${resultCount(data)} result${resultCount(data) === 1 ? "" : "s"}`}</p>
        </div>
      </div>

      {!data && !error && <PageLoader label="Loading applications..." className="min-h-80" />}
      {error && <p className="mt-6 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {data && (
        <div className="mt-6">
          <section className="rounded-xl border border-teal-100 bg-white/85 p-3 shadow-sm ring-1 ring-white/70 sm:p-4">
            <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-teal-700">Application List</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">My Applications</h2>
              </div>
              <span className="self-start rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 shadow-sm sm:self-auto">{data.applications.length} application{data.applications.length === 1 ? "" : "s"}</span>
            </div>
            <div className="max-h-[65vh] min-h-[18rem] overflow-y-auto pr-1 sm:max-h-[calc(100vh-22rem)] sm:min-h-[22rem] sm:pr-2">
              <div className="grid gap-4">
          {data.applications.length === 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <p className="font-medium text-slate-950">{search ? "No matching applications found" : "No applications found"}</p>
              <p className="mt-1 text-sm text-slate-600">{search ? "Try a different student name, email, job title, or status." : "Applications appear here when their email matches your candidate account."}</p>
            </div>
          )}
          {data.applications.map((application) => (
            <Link
              key={application.id}
              href={`/candidate/applications/${application.id}`}
              className="group rounded-lg border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-transparent transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-lg hover:ring-teal-100 sm:p-5"
            >
              <div className="mb-4 h-1.5 rounded-full bg-gradient-to-r from-teal-400 via-indigo-400 to-amber-300" />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950 transition group-hover:text-teal-700">{application.job?.title || "Application"}</h2>
                  <p className="mt-1 text-sm font-medium text-slate-700">{application.candidate?.name || "Student name not available"}</p>
                  <p className="mt-1 text-sm text-slate-600">{application.candidate?.email || "Email not available"} - Applied {formatDate(application.applied_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClass(application.status)}`}>{statusLabel(application.status)}</span>
                  <ChevronRight size={18} className="text-slate-400" />
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {metricCards.map(([label, key, colors]) => (
                  <div key={`${application.id}-${key}`} className={`rounded-lg border bg-gradient-to-br p-3 ${colors}`}>
                    <p className="text-xs font-semibold uppercase opacity-80">{label}</p>
                    <p className="mt-1 text-sm font-semibold capitalize text-slate-950">{key === "match_score" ? application.match_score ?? "Pending" : application[key]}</p>
                  </div>
                ))}
              </div>
            </Link>
          ))}
              </div>
            </div>
          </section>

        </div>
      )}
    </>
  );
}
