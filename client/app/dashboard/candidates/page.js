"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "../../../components/ui/Input.js";
import { api } from "../../../lib/api.js";

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState([]);
  const [query, setQuery] = useState("");
  useEffect(() => { api("/candidates").then(setCandidates); }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredCandidates = candidates.filter((candidate) => {
    if (!normalizedQuery) return true;
    return [
      candidate.name,
      candidate.email,
      candidate.phone,
      candidate.status,
      candidate.job_id?.title,
      candidate.match_score?.toString()
    ].filter(Boolean).some((value) => value.toLowerCase().includes(normalizedQuery));
  });

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Candidates</h1>
          <p className="mt-1 text-sm text-slate-500">{filteredCandidates.length} of {candidates.length} candidates</p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <Input
            className="pl-9"
            placeholder="Search candidates, jobs, status..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="grid gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase text-slate-500 md:grid-cols-4">
          <span>Candidate</span>
          <span>Job</span>
          <span>Match score</span>
          <span>Status</span>
        </div>
        <div className="max-h-[calc(100vh-15rem)] overflow-y-auto">
          {filteredCandidates.map((candidate) => (
            <div key={candidate._id} className="grid gap-2 border-b border-slate-100 p-4 text-sm last:border-b-0 md:grid-cols-4">
              <span className="font-medium text-slate-950">{candidate.name}</span>
              <span className="text-slate-700">{candidate.job_id?.title || "No job linked"}</span>
              <span className="text-slate-700">{candidate.match_score ?? "Processing"}</span>
              <span className="rounded bg-slate-100 px-2 py-1 text-center text-slate-800">{candidate.status}</span>
            </div>
          ))}
          {filteredCandidates.length === 0 && (
            <div className="p-8 text-center text-sm text-slate-500">
              {candidates.length === 0 ? "No candidates submitted yet." : "No candidates match your search."}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
