"use client";

import Link from "next/link";
import { Copy, SquarePlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "../../../components/ui/Button.js";
import { PageLoader } from "../../../components/ui/PageLoader.js";
import { api } from "../../../lib/api.js";

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api("/jobs")
      .then(setJobs)
      .catch((error) => toast.error(error.message))
      .finally(() => setLoading(false));
  }, []);
  function copyLink(id) {
    navigator.clipboard.writeText(`${window.location.origin}/jobs/${id}/apply`);
    toast.success("Public apply link copied");
  }
  if (loading) return <PageLoader label="Loading jobs..." />;
  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Jobs</h1>
          <p className="mt-1 text-sm text-slate-600">Publish roles and share public application links.</p>
        </div>
        <Button asChild><Link href="/dashboard/jobs/create"><SquarePlus size={16} />Create Job</Link></Button>
      </div>
      <div className="mt-6 grid gap-3">
        {jobs.map((job) => (
          <div key={job._id} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
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
