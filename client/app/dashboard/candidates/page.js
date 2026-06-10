"use client";

import { Pencil, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "../../../components/ui/Button.js";
import { Input } from "../../../components/ui/Input.js";
import { api } from "../../../lib/api.js";

const statusOptions = ["submitted", "shortlist", "rejected", "hold", "hired"];

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState([]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setCandidates(await api("/candidates"));
    } catch (error) {
      toast.error(error.message);
    }
  }

  useEffect(() => { load(); }, []);

  function openEditor(candidate) {
    setEditing({
      _id: candidate._id,
      name: candidate.name || "",
      email: candidate.email || "",
      phone: candidate.phone || "",
      status: candidate.status || "submitted",
      match_score: candidate.match_score ?? ""
    });
  }

  async function saveCandidate(event) {
    event.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      await api(`/candidates/${editing._id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editing.name,
          email: editing.email,
          phone: editing.phone,
          status: editing.status,
          match_score: editing.match_score
        })
      });
      toast.success("Candidate updated");
      setEditing(null);
      await load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

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
        <div className="grid gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase text-slate-500 md:grid-cols-[1fr_1fr_120px_120px_100px]">
          <span>Candidate</span>
          <span>Job</span>
          <span>Match score</span>
          <span>Status</span>
          <span>Control</span>
        </div>
        <div className="max-h-[calc(100vh-15rem)] overflow-y-auto">
          {filteredCandidates.map((candidate) => (
            <div key={candidate._id} className="grid gap-2 border-b border-slate-100 p-4 text-sm last:border-b-0 md:grid-cols-[1fr_1fr_120px_120px_100px] md:items-center">
              <span>
                <span className="block font-medium text-slate-950">{candidate.name}</span>
                <span className="block text-xs text-slate-500">{candidate.email}</span>
              </span>
              <span className="text-slate-700">{candidate.job_id?.title || "No job linked"}</span>
              <span className="text-slate-700">{candidate.match_score ?? "Processing"}</span>
              <span className="rounded bg-slate-100 px-2 py-1 text-center text-slate-800">{candidate.status}</span>
              <Button
                type="button"
                variant="outline"
                className="h-8 px-2"
                onClick={() => openEditor(candidate)}
                disabled={candidate.status === "hired"}
                title={candidate.status === "hired" ? "Hired candidates are locked" : "Edit candidate"}
              >
                <Pencil size={14} /> Edit
              </Button>
            </div>
          ))}
          {filteredCandidates.length === 0 && (
            <div className="p-8 text-center text-sm text-slate-500">
              {candidates.length === 0 ? "No candidates submitted yet." : "No candidates match your search."}
            </div>
          )}
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4">
          <form onSubmit={saveCandidate} className="w-full max-w-xl rounded-md border border-slate-200 bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-950">Recruiter Control</h2>
            <p className="mt-1 text-sm text-slate-600">Update this application even if it was rejected.</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Name
                <Input className="mt-2" value={editing.name} onChange={(event) => setEditing((current) => ({ ...current, name: event.target.value }))} required />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Email
                <Input className="mt-2" type="email" value={editing.email} onChange={(event) => setEditing((current) => ({ ...current, email: event.target.value }))} required />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Phone
                <Input className="mt-2" value={editing.phone} onChange={(event) => setEditing((current) => ({ ...current, phone: event.target.value }))} />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Match score
                <Input className="mt-2" type="number" min="0" max="100" value={editing.match_score} onChange={(event) => setEditing((current) => ({ ...current, match_score: event.target.value }))} />
              </label>
              <label className="block text-sm font-medium text-slate-700 md:col-span-2">
                Application status
                <select
                  value={editing.status}
                  onChange={(event) => setEditing((current) => ({ ...current, status: event.target.value }))}
                  className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                >
                  {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
