"use client";

import { useEffect, useState } from "react";
import { api } from "../../../lib/api.js";

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState([]);
  useEffect(() => { api("/candidates").then(setCandidates); }, []);
  return (
    <section>
      <h1 className="text-2xl font-semibold">Candidates</h1>
      <div className="mt-6 overflow-hidden rounded-md border border-slate-200 bg-white">
        {candidates.map((candidate) => (
          <div key={candidate._id} className="grid gap-2 border-b border-slate-100 p-4 text-sm md:grid-cols-4">
            <span className="font-medium">{candidate.name}</span>
            <span>{candidate.job_id?.title}</span>
            <span>{candidate.match_score ?? "Processing"}</span>
            <span className="rounded bg-slate-100 px-2 py-1 text-center">{candidate.status}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
