"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, BriefcaseBusiness, CalendarDays, CheckCircle2, X } from "lucide-react";
import ApplicationForm from "../../../components/jobs/ApplicationForm.js";
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
  const router = useRouter();
  const [job, setJob] = useState(null);
  const [applying, setApplying] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => { api(`/jobs/${jobId}`).then(setJob); }, [jobId]);
  if (!job) return <main className="p-8 text-sm text-slate-600">Loading job...</main>;

  const missedDeadline = isExpired(job.application_deadline);

  return (
    <main className="min-h-screen bg-[#f4f7f7] px-4 py-8 md:px-8">
      <section className="mx-auto max-w-4xl">
        <Button type="button" variant="ghost" className="mb-4 px-2" onClick={() => router.back()}>
          <ArrowLeft size={17} /> Back
        </Button>

        <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700">
                <BriefcaseBusiness size={15} /> Published job
              </div>
              <h1 className="mt-4 text-3xl font-semibold text-slate-950 md:text-4xl">{job.title}</h1>
              <p className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500">
                <CalendarDays size={15} /> Application deadline: {formatDate(job.application_deadline)}
              </p>
            </div>
            {submitted && (
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                <CheckCircle2 size={15} /> Applied
              </span>
            )}
          </div>

          <p className="mt-6 text-base leading-7 text-slate-600">{job.description}</p>

          <div className="mt-6 flex flex-wrap gap-2">
            {[...(job.required_skills || []), ...(job.preferred_skills || [])].map((skill) => (
              <span key={skill} className="rounded-md bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">{skill}</span>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {missedDeadline ? (
              <Button variant="outline" disabled>Deadline passed</Button>
            ) : (
              <Button type="button" onClick={() => setApplying(true)} disabled={submitted}>
                {submitted ? "Application submitted" : "Apply now"}
              </Button>
            )}
          </div>
        </div>
      </section>

      {applying && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
          <button className="absolute inset-0" type="button" aria-label="Close application form" onClick={() => setApplying(false)} />
          <div className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-md border border-slate-200 bg-white p-5 shadow-2xl md:p-6">
            <Button type="button" variant="ghost" className="absolute right-3 top-3 h-8 px-2" aria-label="Close" onClick={() => setApplying(false)}>
              <X size={17} />
            </Button>
            <ApplicationForm
              jobId={job._id}
              job={job}
              compact
              onSuccess={() => {
                setSubmitted(true);
                window.setTimeout(() => setApplying(false), 900);
              }}
            />
          </div>
        </div>
      )}
    </main>
  );
}
