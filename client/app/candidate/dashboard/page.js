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
  if (["reject", "rejected"].includes(status)) return "bg-red-50 text-red-700";
  if (["shortlist", "approved", "selected"].includes(status)) return "bg-emerald-50 text-emerald-700";
  return "bg-amber-50 text-amber-700";
}

function resultCount(data) {
  return data?.applications?.length || 0;
}

export default function CandidateDashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

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
      <div className="sticky top-16 z-30 -mx-4 border-b border-slate-200 bg-[#f4f7f7]/95 px-4 pb-4 pt-1 backdrop-blur md:-mx-8 md:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-teal-700">Candidate Portal</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-950">Applications</h1>
          </div>
          <Button asChild variant="outline">
            <Link href="/candidate/notifications"><Bell size={16} />{data?.unread_count || 0} unread</Link>
          </Button>
        </div>

        <div className="mt-5 flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search applications by student name, email, job title, or status"
              className="pl-9 pr-9"
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
          <p className="text-sm text-slate-500">{loading ? "Searching..." : `${resultCount(data)} result${resultCount(data) === 1 ? "" : "s"}`}</p>
        </div>
      </div>

      {!data && !error && <PageLoader label="Loading applications..." className="min-h-80" />}
      {error && <p className="mt-6 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {data && (
        <div className="mt-6 space-y-8">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-950">My Applications</h2>
              <span className="text-sm text-slate-500">{data.applications.length} application{data.applications.length === 1 ? "" : "s"}</span>
            </div>
            <div className="grid gap-4">
          {data.applications.length === 0 && (
            <div className="rounded-md border border-slate-200 bg-white p-6">
              <p className="font-medium text-slate-950">{search ? "No matching applications found" : "No applications found"}</p>
              <p className="mt-1 text-sm text-slate-600">{search ? "Try a different student name, email, job title, or status." : "Applications appear here when their email matches your candidate account."}</p>
            </div>
          )}
          {data.applications.map((application) => (
            <Link
              key={application.id}
              href={`/candidate/applications/${application.id}`}
              className="rounded-md border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-200 hover:shadow-md"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">{application.job?.title || "Application"}</h2>
                  <p className="mt-1 text-sm font-medium text-slate-700">{application.candidate?.name || "Student name not available"}</p>
                  <p className="mt-1 text-sm text-slate-600">{application.candidate?.email || "Email not available"} - Applied {formatDate(application.applied_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClass(application.status)}`}>{application.status}</span>
                  <ChevronRight size={18} className="text-slate-400" />
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs font-medium uppercase text-slate-500">Current Step</p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">{application.current_step}</p>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs font-medium uppercase text-slate-500">Workflow</p>
                  <p className="mt-1 text-sm font-semibold capitalize text-slate-950">{application.workflow_status}</p>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs font-medium uppercase text-slate-500">Match Score</p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">{application.match_score ?? "Pending"}</p>
                </div>
              </div>
            </Link>
          ))}
            </div>
          </section>

        </div>
      )}
    </>
  );
}
