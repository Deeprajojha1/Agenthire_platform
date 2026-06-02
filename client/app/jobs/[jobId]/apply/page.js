"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Button } from "../../../../components/ui/Button.js";
import { Input } from "../../../../components/ui/Input.js";
import { api } from "../../../../lib/api.js";

export default function ApplyPage() {
  const { jobId } = useParams();
  const [fileName, setFileName] = useState("");
  const [state, setState] = useState("idle");
  const [result, setResult] = useState(null);
  async function submit(event) {
    event.preventDefault();
    setState("processing");
    const form = new FormData(event.currentTarget);
    form.set("job_id", jobId);
    try {
      const data = await api("/candidates/upload", { method: "POST", body: form });
      setResult(data);
      setState("success");
    } catch (err) {
      setResult({ error: err.message });
      setState("failed");
    }
  }
  return (
    <main className="mx-auto max-w-xl p-6">
      <form onSubmit={submit} className="rounded-md border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-semibold">Candidate Application</h1>
        <div className="mt-6 space-y-3">
          <Input name="name" placeholder="Full name" required />
          <Input name="email" type="email" placeholder="Email" required />
          <Input name="phone" placeholder="Phone" />
          <input type="hidden" name="job_id" value={jobId} />
          <Input name="resume" type="file" accept="application/pdf" required onChange={(event) => setFileName(event.target.files?.[0]?.name || "")} />
          {fileName && <p className="text-sm text-slate-600">Selected: {fileName}</p>}
        </div>
        <Button className="mt-5 w-full" disabled={state === "processing"}>{state === "processing" ? "Processing resume..." : "Submit application"}</Button>
        {state === "success" && <p className="mt-4 rounded bg-green-50 p-3 text-sm text-green-700">Workflow started. Status: {result.workflow.status}. Current state: {result.workflow.current_state}.</p>}
        {state === "failed" && <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{result.error}</p>}
      </form>
    </main>
  );
}
