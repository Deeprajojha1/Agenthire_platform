"use client";

import { BriefcaseBusiness, CalendarDays, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import ApplicationForm from "../../../components/jobs/ApplicationForm.js";
import { Button } from "../../../components/ui/Button.js";
import { Input } from "../../../components/ui/Input.js";
import { PageLoader } from "../../../components/ui/PageLoader.js";
import { api } from "../../../lib/api.js";

function formatDate(value) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function isExpired(value) {
  if (!value) return false;
  const deadline = new Date(value);
  deadline.setHours(23, 59, 59, 999);
  return deadline.getTime() < Date.now();
}

export default function CandidateJobsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [applyingJob, setApplyingJob] = useState(null);
  const [submittedJobs, setSubmittedJobs] = useState(new Set());

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
        setData(await api(`/candidate/jobs${query}`, { signal: controller.signal }));
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
            <h1 className="mt-1 text-2xl font-semibold text-slate-950">Jobs</h1>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">Published by recruiters</span>
        </div>

        <div className="mt-5 flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by job title, skill, or description"
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
          <p className="text-sm text-slate-500">{loading ? "Searching..." : `${data?.jobs?.length || 0} job${data?.jobs?.length === 1 ? "" : "s"}`}</p>
        </div>
      </div>

      {!data && !error && <PageLoader label="Loading jobs..." className="min-h-80" />}
      {error && <p className="mt-6 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {data && (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {data.jobs.length === 0 && (
            <div className="rounded-md border border-slate-200 bg-white p-6 lg:col-span-2">
              <p className="font-medium text-slate-950">{search ? "No matching jobs found" : "No published jobs found"}</p>
              <p className="mt-1 text-sm text-slate-600">{search ? "Try a different job title, skill, or description." : "Recruiter-published jobs will appear here."}</p>
            </div>
          )}
          {data.jobs.map((job) => (
            <div key={job.id} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
              {(() => {
                const alreadySubmitted = submittedJobs.has(job.id);
                const missedDeadline = !job.already_applied && !alreadySubmitted && isExpired(job.application_deadline);
                return (
                  <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-teal-700">
                    <BriefcaseBusiness size={15} /> Published Job
                  </div>
                  <h2 className="mt-2 text-lg font-semibold text-slate-950">{job.title}</h2>
                  <p className="mt-1 line-clamp-3 text-sm text-slate-600">{job.description}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>Posted {formatDate(job.created_at)}</span>
                    <span className="inline-flex items-center gap-1"><CalendarDays size={13} />Deadline {formatDate(job.application_deadline)}</span>
                  </div>
                </div>
                {(job.already_applied || alreadySubmitted) && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Applied</span>}
                {missedDeadline && <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">Missing</span>}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {[...(job.required_skills || []), ...(job.preferred_skills || [])].slice(0, 8).map((skill) => (
                  <span key={`${job.id}-${skill}`} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{skill}</span>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {job.already_applied || alreadySubmitted ? (
                  <Button variant="outline" disabled>Applied</Button>
                ) : missedDeadline ? (
                  <Button variant="outline" disabled>Missing deadline</Button>
                ) : (
                  <Button type="button" onClick={() => setApplyingJob(job)}>Apply Now</Button>
                )}
              </div>
                  </>
                );
              })()}
            </div>
          ))}
        </div>
      )}

      {applyingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
          <button className="absolute inset-0" type="button" aria-label="Close application form" onClick={() => setApplyingJob(null)} />
          <div className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-md border border-slate-200 bg-white p-5 shadow-2xl md:p-6">
            <Button type="button" variant="ghost" className="absolute right-3 top-3 h-8 px-2" aria-label="Close" onClick={() => setApplyingJob(null)}>
              <X size={17} />
            </Button>
            <ApplicationForm
              jobId={applyingJob.id}
              job={applyingJob}
              compact
              onSuccess={() => {
                setSubmittedJobs((current) => new Set([...current, applyingJob.id]));
                window.setTimeout(() => setApplyingJob(null), 900);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
