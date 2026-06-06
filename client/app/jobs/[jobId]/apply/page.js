"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "../../../../components/ui/Button.js";
import { Input } from "../../../../components/ui/Input.js";
import { InlineLoader } from "../../../../components/ui/PageLoader.js";
import { api, getToken } from "../../../../lib/api.js";

export default function ApplyPage() {
  const { jobId } = useParams();
  const router = useRouter();
  const [fileName, setFileName] = useState("");
  const [state, setState] = useState("idle");
  const [result, setResult] = useState(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [duplicateMessage, setDuplicateMessage] = useState("");
  const [job, setJob] = useState(null);

  function isExpired(value) {
    if (!value) return false;
    const deadline = new Date(value);
    deadline.setHours(23, 59, 59, 999);
    return deadline.getTime() < Date.now();
  }

  function formatDate(value) {
    if (!value) return "No deadline";
    return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
  }

  const deadlinePassed = isExpired(job?.application_deadline);

  useEffect(() => {
    api(`/jobs/${jobId}`).then(setJob).catch((error) => toast.error(error.message));
  }, [jobId]);

  useEffect(() => {
    if (!getToken()) return;
    api("/candidate/auth/me")
      .then((data) => {
        setName(data.user?.name || "");
        setEmail(data.user?.email || "");
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (state !== "success") return undefined;
    const timeout = window.setTimeout(() => {
      router.push("/candidate/jobs");
    }, 1200);
    return () => window.clearTimeout(timeout);
  }, [router, state]);

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
    if (deadlinePassed) return;
    if (duplicateMessage) return;
    setState("processing");
    const form = new FormData(event.currentTarget);
    form.set("job_id", jobId);
    try {
      const data = await api("/candidates/upload", { method: "POST", body: form });
      setResult(data);
      setState("success");
      toast.success("Application submitted");
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
    <main className="mx-auto max-w-xl p-6">
      <form method="post" onSubmit={submit} className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Candidate Application</h1>
        {job && (
          <div className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-700">
            <p className="font-medium">{job.title}</p>
            <p className="mt-1">Application deadline: {formatDate(job.application_deadline)}</p>
          </div>
        )}
        <div className="mt-6 space-y-3">
          <Input name="name" placeholder="Full name" required value={name} onChange={(event) => setName(event.target.value)} />
          <Input
            name="email"
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setDuplicateMessage("");
            }}
            onBlur={(event) => checkEmail(event.target.value)}
          />
          {checkingEmail && <p className="text-sm text-slate-500">Checking previous application...</p>}
          {duplicateMessage && <p className="rounded bg-amber-50 p-3 text-sm text-amber-800">{duplicateMessage}</p>}
          {deadlinePassed && <p className="rounded bg-red-50 p-3 text-sm text-red-700">Missing: the application deadline for this job has passed.</p>}
          <Input name="phone" placeholder="Phone" />
          <input type="hidden" name="job_id" value={jobId} />
          <Input name="resume" type="file" accept="application/pdf" required onChange={(event) => setFileName(event.target.files?.[0]?.name || "")} />
          {fileName && <p className="text-sm text-slate-600">Selected: {fileName}</p>}
        </div>
        <Button className="mt-5 w-full" disabled={state === "processing" || checkingEmail || Boolean(duplicateMessage) || deadlinePassed}>
          {state === "processing" ? <InlineLoader label="Processing resume..." /> : deadlinePassed ? "Missing deadline" : duplicateMessage ? "Already applied" : "Submit application"}
        </Button>
        {state === "success" && <p className="mt-4 rounded bg-green-50 p-3 text-sm text-green-700">Application submitted. Redirecting to jobs...</p>}
        {state === "failed" && <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{result.error}</p>}
      </form>
    </main>
  );
}
