"use client";

import { useEffect, useId, useState } from "react";
import { CheckCircle2, FileUp, Mail, Phone, UserRound } from "lucide-react";
import { toast } from "sonner";
import { api, getToken } from "../../lib/api.js";
import { Button } from "../ui/Button.js";
import { Input } from "../ui/Input.js";
import { InlineLoader } from "../ui/PageLoader.js";

function formatDate(value) {
  if (!value) return "No deadline";
  return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function isExpired(value, now) {
  if (!value || !now) return false;
  const deadline = new Date(value);
  deadline.setHours(23, 59, 59, 999);
  return deadline.getTime() < now;
}

export default function ApplicationForm({ jobId, job: initialJob, compact = false, onSuccess }) {
  const resumeInputId = useId();
  const [fileName, setFileName] = useState("");
  const [state, setState] = useState("idle");
  const [result, setResult] = useState(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [duplicateMessage, setDuplicateMessage] = useState("");
  const [job, setJob] = useState(initialJob || null);
  const [currentTime, setCurrentTime] = useState(0);

  const deadlinePassed = isExpired(job?.application_deadline, currentTime);

  useEffect(() => {
    if (initialJob) {
      setJob(initialJob);
      return;
    }
    api(`/jobs/${jobId}`).then(setJob).catch((error) => toast.error(error.message));
  }, [initialJob, jobId]);

  useEffect(() => {
    setCurrentTime(Date.now());
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!getToken()) return;
    api("/candidate/auth/me")
      .then((data) => {
        setName(data.user?.name || "");
        setEmail(data.user?.email || "");
      })
      .catch(() => {});
  }, []);

  async function checkEmail(nextEmail) {
    const value = nextEmail.trim();
    setEmail(nextEmail);
    setDuplicateMessage("");
    if (!value || !value.includes("@")) return;
    setCheckingEmail(true);
    try {
      const data = await api("/candidates/check-application", {
        method: "POST",
        body: JSON.stringify({ job_id: jobId, email: value })
      });
      if (data.already_applied) {
        setDuplicateMessage("You have already applied for this job with this email.");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setCheckingEmail(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    if (deadlinePassed || duplicateMessage) return;
    setState("processing");
    const form = new FormData(event.currentTarget);
    form.set("job_id", jobId);
    try {
      const data = await api("/candidates/upload", { method: "POST", body: form });
      setResult(data);
      setState("success");
      toast.success("Application submitted");
      onSuccess?.(data);
    } catch (err) {
      setResult({ error: err.message });
      setState("failed");
      if (err.message.toLowerCase().includes("already applied")) {
        setDuplicateMessage(err.message);
      }
      toast.error(err.message);
    }
  }

  return (
    <form method="post" onSubmit={submit} className={compact ? "" : "rounded-md border border-slate-200 bg-white p-6 shadow-sm"}>
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Candidate Application</h1>
        <p className="mt-1 text-sm text-slate-500">Fill your details and upload your resume as a PDF.</p>
      </div>

      {job && (
        <div className="mt-5 rounded-md border border-teal-100 bg-teal-50 p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-950">{job.title}</p>
          <p className="mt-1">Application deadline: {formatDate(job.application_deadline)}</p>
        </div>
      )}

      <div className="mt-6 space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          Full name
          <div className="relative mt-2">
            <UserRound className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input name="name" placeholder="Your full name" required value={name} onChange={(event) => setName(event.target.value)} className="pl-9" />
          </div>
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Email address
          <div className="relative mt-2">
            <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setDuplicateMessage("");
              }}
              onBlur={(event) => checkEmail(event.target.value)}
              className="pl-9"
            />
          </div>
        </label>

        {checkingEmail && <p className="text-sm text-slate-500">Checking previous application...</p>}
        {duplicateMessage && <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">{duplicateMessage}</p>}
        {deadlinePassed && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">The application deadline for this job has passed.</p>}

        <label className="block text-sm font-medium text-slate-700">
          Phone
          <div className="relative mt-2">
            <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input name="phone" placeholder="Phone number" className="pl-9" />
          </div>
        </label>

        <div className="block text-sm font-medium text-slate-700">
          <span>Resume PDF</span>
          <div className="mt-2 rounded-md border border-dashed border-slate-300 bg-slate-50 p-4">
            <label htmlFor={resumeInputId} className="flex cursor-pointer items-center gap-3 text-sm text-slate-600">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-teal-700 shadow-sm"><FileUp size={18} /></span>
              <span>
                <span className="block font-medium text-slate-800">{fileName || "Choose resume PDF"}</span>
                <span className="text-xs text-slate-500">PDF only, up to 5 MB</span>
              </span>
            </label>
            <input id={resumeInputId} name="resume" type="file" accept="application/pdf" required className="sr-only" onChange={(event) => setFileName(event.target.files?.[0]?.name || "")} />
          </div>
        </div>

        <input type="hidden" name="job_id" value={jobId} />
      </div>

      <Button className="mt-6 w-full" disabled={state === "processing" || checkingEmail || Boolean(duplicateMessage) || deadlinePassed}>
        {state === "processing" ? <InlineLoader label="Processing resume..." /> : deadlinePassed ? "Deadline passed" : duplicateMessage ? "Already applied" : "Submit application"}
      </Button>

      {state === "success" && (
        <p className="mt-4 flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-700">
          <CheckCircle2 size={16} /> Application submitted successfully.
        </p>
      )}
      {state === "failed" && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{result.error}</p>}
    </form>
  );
}
