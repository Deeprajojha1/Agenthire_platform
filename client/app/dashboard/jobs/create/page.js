"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "../../../../components/ui/Button.js";
import { Input } from "../../../../components/ui/Input.js";
import { Textarea } from "../../../../components/ui/Textarea.js";
import { api } from "../../../../lib/api.js";

function splitSkills(value) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export default function CreateJobPage() {
  const router = useRouter();
  const [required, setRequired] = useState("React, JavaScript, CSS");
  const [preferred, setPreferred] = useState("Next.js, Tailwind CSS");
  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api("/jobs", {
      method: "POST",
      body: JSON.stringify({
        title: form.get("title"),
        description: form.get("description"),
        required_skills: splitSkills(required),
        preferred_skills: splitSkills(preferred),
        min_experience: Number(form.get("min_experience") || 0)
      })
    });
    router.push("/dashboard/jobs");
  }
  return (
    <form onSubmit={submit} className="max-w-3xl">
      <h1 className="text-2xl font-semibold">Create Job</h1>
      <div className="mt-6 space-y-4 rounded-md border border-slate-200 bg-white p-5">
        <Input name="title" defaultValue="Frontend Developer" required />
        <Textarea name="description" defaultValue="Build polished web interfaces and collaborate with product teams." required />
        <Input name="min_experience" type="number" min="0" defaultValue="2" />
        <Input value={required} onChange={(event) => setRequired(event.target.value)} />
        <Input value={preferred} onChange={(event) => setPreferred(event.target.value)} />
        <div className="flex flex-wrap gap-2">
          {[...splitSkills(required), ...splitSkills(preferred)].map((skill) => <span key={skill} className="rounded bg-slate-100 px-2 py-1 text-xs">{skill}</span>)}
        </div>
        <Button>Create workflow-ready job</Button>
      </div>
    </form>
  );
}
