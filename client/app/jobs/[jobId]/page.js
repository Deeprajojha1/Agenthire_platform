"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/Button.js";
import { api } from "../../../lib/api.js";

function formatDate(value) {
  if (!value) return "No deadline";
  return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function isExpired(value) {
  if (!value) return false;
  const deadline = new Date(value);
  deadline.setHours(23, 59, 59, 999);
  return deadline.getTime() < Date.now();
}

export default function PublicJobPage() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  useEffect(() => { api(`/jobs/${jobId}`).then(setJob); }, [jobId]);
  if (!job) return <main className="p-8 text-sm text-slate-600">Loading job...</main>;
  return (
    <main className="mx-auto max-w-3xl p-6">
      <section className="rounded-md border border-slate-200 bg-white p-6">
        <h1 className="text-3xl font-semibold">{job.title}</h1>
        <p className="mt-2 text-sm font-medium text-slate-500">Application deadline: {formatDate(job.application_deadline)}</p>
        <p className="mt-4 text-slate-600">{job.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {[...job.required_skills, ...job.preferred_skills].map((skill) => <span key={skill} className="rounded bg-slate-100 px-2 py-1 text-xs">{skill}</span>)}
        </div>
        {isExpired(job.application_deadline) ? (
          <Button className="mt-6" variant="outline" disabled>Missing deadline</Button>
        ) : (
          <Button className="mt-6" asChild><Link href={`/jobs/${job._id}/apply`}>Apply now</Link></Button>
        )}
      </section>
    </main>
  );
}
