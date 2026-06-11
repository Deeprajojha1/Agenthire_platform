"use client";

import Link from "next/link";
import { CalendarDays, Copy, Pencil, Search, SquarePlus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { JobForm } from "../../../components/jobs/JobForm.js";
import { Button } from "../../../components/ui/Button.js";
import { Input } from "../../../components/ui/Input.js";
import { PageLoader } from "../../../components/ui/PageLoader.js";
import { api } from "../../../lib/api.js";

function formatDate(value) {
  if (!value) return "No deadline";
  return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [query, setQuery] = useState("");
  const [copiedLink, setCopiedLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  useEffect(() => {
    api("/jobs")
      .then(setJobs)
      .catch((error) => toast.error(error.message))
      .finally(() => setLoading(false));
  }, []);
  function fallbackCopy(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    return copied;
  }

  async function copyLink(id) {
    const link = `${window.location.origin}/jobs/${id}/apply`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      } else if (!fallbackCopy(link)) {
        throw new Error("Clipboard unavailable");
      }
      setCopiedLink(link);
      toast.success("Public apply link copied", { description: link });
    } catch {
      const copied = fallbackCopy(link);
      setCopiedLink(link);
      if (copied) {
        toast.success("Public apply link copied", { description: link });
      } else {
        toast.error("Copy blocked by browser. Link is shown below.");
      }
    }
  }

  async function createJob(payload) {
    setCreating(true);
    try {
      const job = await api("/jobs", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setJobs((current) => [job, ...current]);
      setCreateOpen(false);
      toast.success("Job created");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setCreating(false);
    }
  }

  const normalizedQuery = query.trim().toLowerCase();
  const filteredJobs = jobs.filter((job) => {
    if (!normalizedQuery) return true;
    return [
      job.title,
      job.description,
      ...(job.required_skills || []),
      ...(job.preferred_skills || []),
      job.min_experience?.toString(),
      job.application_deadline ? formatDate(job.application_deadline) : ""
    ].filter(Boolean).some((value) => value.toLowerCase().includes(normalizedQuery));
  });
  if (loading) return <PageLoader label="Loading jobs..." />;
  return (
    <section className="flex h-[calc(100vh-5.5rem)] flex-col overflow-hidden md:h-[calc(100vh-8rem)]">
      <div className="shrink-0 rounded-xl border border-teal-100 bg-gradient-to-r from-white/95 via-teal-50/95 to-indigo-50/95 p-4 shadow-sm ring-1 ring-white/70 sm:p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-teal-700">Recruiter Console</p>
          <h1 className="mt-1 text-xl font-semibold text-slate-950 sm:text-2xl">Jobs</h1>
          <p className="mt-1 text-sm text-slate-600">{filteredJobs.length} of {jobs.length} jobs. Publish roles and share public application links.</p>
        </div>
        <Button type="button" className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-sm hover:from-teal-600 hover:to-teal-700 sm:w-auto" onClick={() => setCreateOpen(true)}><SquarePlus size={16} />Create Job</Button>
      </div>
      </div>
      <div className="relative mt-4 w-full shrink-0 sm:mt-6 sm:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
        <Input
          className="border-slate-200 bg-white/90 pl-9 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          placeholder="Search jobs, skills, description..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      {copiedLink && (
        <div className="mt-4 shrink-0 rounded-md border border-teal-200 bg-teal-50 p-3 text-sm text-teal-900">
          <p className="font-medium">Public apply link</p>
          <p className="mt-1 break-all">{copiedLink}</p>
        </div>
      )}
      <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {filteredJobs.map((job) => (
          <div key={job._id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-transparent transition hover:border-teal-200 hover:shadow-md hover:ring-teal-100">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0 flex-1">
                <h2 className="break-words font-semibold text-slate-950">{job.title}</h2>
                <p className="mt-1 line-clamp-3 text-sm leading-6 text-slate-600">{job.description}</p>
                <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                  <CalendarDays size={14} /> Deadline: {formatDate(job.application_deadline)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(job.required_skills || []).slice(0, 5).map((skill) => (
                    <span key={skill} className="rounded bg-teal-50 px-2 py-1 text-xs font-medium text-teal-800">{skill}</span>
                  ))}
                </div>
              </div>
              <div className="grid w-full grid-cols-2 gap-2 md:w-auto">
                <Button className="w-full px-2 text-xs border-slate-200 bg-white text-slate-900 hover:bg-indigo-50 hover:text-indigo-700 sm:px-4 sm:text-sm" variant="outline" asChild><Link href={`/dashboard/jobs/${job._id}/edit`}><Pencil size={15} />Edit</Link></Button>
                <Button className="w-full px-2 text-xs border-slate-200 bg-white text-slate-900 hover:bg-teal-50 hover:text-teal-700 sm:px-4 sm:text-sm" variant="outline" onClick={() => copyLink(job._id)}><Copy size={15} />Copy link</Button>
              </div>
            </div>
          </div>
        ))}
        {filteredJobs.length === 0 && (
          <div className="rounded-md border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            {jobs.length === 0 ? "No jobs created yet." : "No jobs match your search."}
          </div>
        )}
      </div>
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-3 py-5 backdrop-blur-sm sm:px-4">
          <button className="absolute inset-0" type="button" aria-label="Close create job" onClick={() => setCreateOpen(false)} />
          <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 shadow-2xl sm:p-6">
            <Button
              type="button"
              variant="ghost"
              className="absolute right-3 top-3 h-8 px-2"
              aria-label="Close"
              onClick={() => setCreateOpen(false)}
            >
              <X size={17} />
            </Button>
            <JobForm loading={creating} onSubmit={createJob} />
          </div>
        </div>
      )}
    </section>
  );
}
