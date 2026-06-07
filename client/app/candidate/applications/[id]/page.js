"use client";

import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "sonner";
import { Button } from "../../../../components/ui/Button.js";
import { PageLoader } from "../../../../components/ui/PageLoader.js";
import { api, getToken, SOCKET_URL } from "../../../../lib/api.js";

function formatDate(value) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function Bar({ label, value }) {
  const width = value == null ? 0 : Math.max(0, Math.min(100, Number(value)));
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-500">{value == null ? "Pending" : `${width}%`}</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-teal-700" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export default function CandidateApplicationPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params?.id;
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const loadApplication = useCallback(async () => {
    if (!applicationId) return;
    setData(await api(`/candidate/applications/${applicationId}`));
  }, [applicationId]);

  useEffect(() => {
    loadApplication().catch((err) => setError(err.message));
  }, [loadApplication]);

  useEffect(() => {
    if (!applicationId) return undefined;
    const token = getToken();
    if (!token) return undefined;

    const socket = io(SOCKET_URL, { auth: { token } });
    socket.emit("application:subscribe", applicationId);
    socket.on("workflow:update", (event) => {
      toast.info(event.message || "Application updated");
      loadApplication().catch((err) => setError(err.message));
    });

    return () => socket.disconnect();
  }, [applicationId, loadApplication]);

  const application = data?.application;
  const job = application?.job || {};

  return (
    <>
      {!data && !error && <PageLoader label="Loading application..." className="min-h-80" />}
      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {application && (
        <div className="space-y-6">
          <div className="rounded-md border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                aria-label="Go back"
                title="Go back"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <p className="text-sm font-medium text-teal-700">Application Details</p>
            </div>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-slate-950">{job.title || "Application"}</h1>
                <p className="mt-1 text-sm text-slate-600">Applied {formatDate(application.applied_at)}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">{application.status}</span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-md bg-slate-50 p-3">
                <p className="text-xs font-medium uppercase text-slate-500">Current Status</p>
                <p className="mt-1 text-sm font-semibold capitalize text-slate-950">{application.workflow_status}</p>
              </div>
              <div className="rounded-md bg-slate-50 p-3">
                <p className="text-xs font-medium uppercase text-slate-500">Match Score</p>
                <p className="mt-1 text-sm font-semibold text-slate-950">{application.match_score ?? "Pending"}</p>
              </div>
              <div className="rounded-md bg-slate-50 p-3">
                <p className="text-xs font-medium uppercase text-slate-500">Recruiter Decision</p>
                <p className="mt-1 text-sm font-semibold capitalize text-slate-950">{application.recruiter_decision}</p>
              </div>
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-950">Workflow</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-5">
              {application.workflow_steps.map((step) => (
                <div key={step.label} className={`rounded-md border p-3 ${step.status === "current" ? "border-teal-300 bg-teal-50" : step.status === "completed" ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}>
                  <p className="text-sm font-semibold text-slate-950">{step.label}</p>
                  <p className="mt-1 text-xs font-medium capitalize text-slate-500">{step.status}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-md border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-950">Match Score</h2>
              <div className="mt-5 space-y-5">
                <Bar label="Overall Match Score" value={application.match_score_breakdown.overall} />
                <Bar label="Skills Match" value={application.match_score_breakdown.skills} />
                <Bar label="Experience Match" value={application.match_score_breakdown.experience} />
                <Bar label="Education Match" value={application.match_score_breakdown.education} />
              </div>
            </div>

            <div className="rounded-md border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-950">Timeline</h2>
              <div className="scrollbar-hidden mt-4 max-h-80 space-y-3 overflow-y-auto pr-2">
                {data.timeline.length === 0 && <p className="text-sm text-slate-600">No workflow events yet.</p>}
                {data.timeline.map((item) => (
                  <div key={item.id} className="border-l-2 border-teal-200 pl-3">
                    <p className="text-sm font-semibold capitalize text-slate-950">{item.event.replaceAll("_", " ")}</p>
                    <p className="text-xs capitalize text-slate-500">{formatDate(item.created_at)} - {item.status.replaceAll("_", " ")}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {application.rejection_reason && (
            <div className="rounded-md border border-red-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-950">Reason Breakdown</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Matched Skills</p>
                  <p className="mt-1 text-sm text-slate-600">{application.rejection_reason.matched_skills.join(", ") || "None recorded"}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">Missing Skills</p>
                  <p className="mt-1 text-sm text-slate-600">{application.rejection_reason.missing_skills.join(", ") || "None recorded"}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">Experience Gap</p>
                  <p className="mt-1 text-sm text-slate-600">Required {application.rejection_reason.required_experience ?? "N/A"} years, profile {application.rejection_reason.candidate_experience ?? "N/A"} years</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">Final Match Score</p>
                  <p className="mt-1 text-sm text-slate-600">{application.rejection_reason.final_match_score ?? "Pending"}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
