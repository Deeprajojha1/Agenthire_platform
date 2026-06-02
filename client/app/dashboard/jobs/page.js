"use client";

import Link from "next/link";
import { Copy, Search, SquarePlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "../../../components/ui/Button.js";
import { Input } from "../../../components/ui/Input.js";
import { PageLoader } from "../../../components/ui/PageLoader.js";
import { api } from "../../../lib/api.js";

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [query, setQuery] = useState("");
  const [copiedLink, setCopiedLink] = useState("");
  const [loading, setLoading] = useState(true);
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
  const normalizedQuery = query.trim().toLowerCase();
  const filteredJobs = jobs.filter((job) => {
    if (!normalizedQuery) return true;
    return [
      job.title,
      job.description,
      ...(job.required_skills || []),
      ...(job.preferred_skills || []),
      job.min_experience?.toString()
    ].filter(Boolean).some((value) => value.toLowerCase().includes(normalizedQuery));
  });
  if (loading) return <PageLoader label="Loading jobs..." />;
  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Jobs</h1>
          <p className="mt-1 text-sm text-slate-600">{filteredJobs.length} of {jobs.length} jobs. Publish roles and share public application links.</p>
        </div>
        <Button asChild><Link href="/dashboard/jobs/create"><SquarePlus size={16} />Create Job</Link></Button>
      </div>
      <div className="relative mt-6 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
        <Input
          className="pl-9"
          placeholder="Search jobs, skills, description..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      {copiedLink && (
        <div className="mt-4 rounded-md border border-teal-200 bg-teal-50 p-3 text-sm text-teal-900">
          <p className="font-medium">Public apply link</p>
          <p className="mt-1 break-all">{copiedLink}</p>
        </div>
      )}
      <div className="mt-4 max-h-[calc(100vh-16rem)] space-y-3 overflow-y-auto pr-1">
        {filteredJobs.map((job) => (
          <div key={job._id} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="font-medium">{job.title}</h2>
                <p className="mt-1 line-clamp-3 text-sm leading-6 text-slate-600">{job.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(job.required_skills || []).slice(0, 5).map((skill) => (
                    <span key={skill} className="rounded bg-teal-50 px-2 py-1 text-xs font-medium text-teal-800">{skill}</span>
                  ))}
                </div>
              </div>
              <Button variant="outline" onClick={() => copyLink(job._id)}><Copy size={16} />Copy public apply link</Button>
            </div>
          </div>
        ))}
        {filteredJobs.length === 0 && (
          <div className="rounded-md border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            {jobs.length === 0 ? "No jobs created yet." : "No jobs match your search."}
          </div>
        )}
      </div>
    </section>
  );
}
