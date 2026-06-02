"use client";

import Link from "next/link";
import { Copy, SquarePlus } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/Button.js";
import { api } from "../../../lib/api.js";

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  useEffect(() => { api("/jobs").then(setJobs); }, []);
  function copyLink(id) {
    navigator.clipboard.writeText(`${window.location.origin}/jobs/${id}/apply`);
  }
  return (
    <section>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Jobs</h1>
        <Button asChild><Link href="/dashboard/jobs/create"><SquarePlus size={16} />Create Job</Link></Button>
      </div>
      <div className="mt-6 grid gap-3">
        {jobs.map((job) => (
          <div key={job._id} className="rounded-md border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-medium">{job.title}</h2>
                <p className="mt-1 text-sm text-slate-600">{job.description}</p>
              </div>
              <Button variant="outline" onClick={() => copyLink(job._id)}><Copy size={16} />Copy public apply link</Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
