"use client";

import { useState } from "react";
import { Button } from "../ui/Button.js";
import { Input } from "../ui/Input.js";
import { InlineLoader } from "../ui/PageLoader.js";
import { Textarea } from "../ui/Textarea.js";

function splitSkills(value) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function formatDateInput(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export function JobForm({ initialJob = {}, loading = false, mode = "create", onSubmit }) {
  const [required, setRequired] = useState((initialJob.required_skills || []).join(", "));
  const [preferred, setPreferred] = useState((initialJob.preferred_skills || []).join(", "));
  const skills = [...splitSkills(required), ...splitSkills(preferred)];

  function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit({
      title: form.get("title"),
      description: form.get("description"),
      required_skills: splitSkills(required),
      preferred_skills: splitSkills(preferred),
      min_experience: Number(form.get("min_experience") || 0),
      application_deadline: form.get("application_deadline") || null
    });
  }

  return (
    <form method="post" onSubmit={submit} className="max-w-3xl">
      <h1 className="text-2xl font-semibold">{mode === "edit" ? "Edit Job" : "Create Job"}</h1>
      <div className="mt-6 space-y-4 rounded-md border border-slate-200 bg-white p-5">
        <div>
          <label htmlFor="title" className="mb-2 block text-sm font-medium text-slate-700">Job title</label>
          <Input id="title" name="title" defaultValue={initialJob.title || ""} placeholder="Example: Full Stack Developer Intern" required />
        </div>
        <div>
          <label htmlFor="description" className="mb-2 block text-sm font-medium text-slate-700">Job description</label>
          <Textarea id="description" name="description" defaultValue={initialJob.description || ""} placeholder="Write the role responsibilities, project work, and candidate expectations." required />
        </div>
        <div>
          <label htmlFor="min_experience" className="mb-2 block text-sm font-medium text-slate-700">Minimum experience</label>
          <Input id="min_experience" name="min_experience" type="number" min="0" defaultValue={initialJob.min_experience ?? ""} placeholder="Example: 0 for fresher, 2 for 2 years" />
        </div>
        <div>
          <label htmlFor="application_deadline" className="mb-2 block text-sm font-medium text-slate-700">Application deadline</label>
          <Input id="application_deadline" name="application_deadline" type="date" defaultValue={formatDateInput(initialJob.application_deadline)} />
        </div>
        <div>
          <label htmlFor="required_skills" className="mb-2 block text-sm font-medium text-slate-700">Required skills</label>
          <Input id="required_skills" value={required} onChange={(event) => setRequired(event.target.value)} placeholder="Example: React, JavaScript, CSS" />
        </div>
        <div>
          <label htmlFor="preferred_skills" className="mb-2 block text-sm font-medium text-slate-700">Preferred skills</label>
          <Input id="preferred_skills" value={preferred} onChange={(event) => setPreferred(event.target.value)} placeholder="Example: Next.js, Tailwind CSS, Node.js" />
        </div>
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => <span key={skill} className="rounded bg-slate-100 px-2 py-1 text-xs">{skill}</span>)}
          </div>
        )}
        <Button disabled={loading}>{loading ? <InlineLoader label={mode === "edit" ? "Saving job..." : "Creating job..."} /> : mode === "edit" ? "Save job" : "Create workflow-ready job"}</Button>
      </div>
    </form>
  );
}
