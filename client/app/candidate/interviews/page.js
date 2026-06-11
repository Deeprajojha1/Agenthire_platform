"use client";

import { CalendarClock, Play } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/Button.js";
import { PageLoader } from "../../../components/ui/PageLoader.js";
import { api } from "../../../lib/api.js";
import { formatDateTime, interviewInfo, toneClasses } from "./interviewHelpers.js";

export default function CandidateInterviewsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    api("/candidate/notifications")
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  const applications = data?.applications || [];

  return (
    <section className="flex h-[calc(100vh-5.5rem)] flex-col overflow-hidden md:h-[calc(100vh-8rem)]">
      <div className="shrink-0 rounded-xl border border-teal-100 bg-gradient-to-r from-white/95 via-teal-50/95 to-indigo-50/95 p-4 shadow-sm backdrop-blur sm:p-5">
        <p className="text-sm font-semibold text-teal-700">Interview Center</p>
        <h1 className="mt-1 text-xl font-semibold text-slate-950 sm:text-2xl">Interviews</h1>
      </div>

      {!data && !error && <PageLoader label="Loading interviews..." className="min-h-0 flex-1" />}
      {error && <p className="mt-6 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {data && (
        <div className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1 sm:mt-6 sm:pr-2">
          {applications.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600 shadow-sm">
              Interview status will appear here after you submit an application.
            </div>
          )}

          {applications.map((item) => {
            const info = interviewInfo(item, now);
            const Icon = info.Icon;
            const interviewStarted = Boolean(item.interview);
            const interviewCompleted = item.interview?.status === "completed";
            const questionCount = item.interview?.questions?.length || 0;
            return (
              <section key={item.application.id} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-teal-700">
                      <CalendarClock size={16} />
                      {item.application.job?.title || "Application"}
                    </div>
                    <h2 className="mt-2 text-lg font-semibold text-slate-950">{info.label}</h2>
                    <p className="mt-1 text-sm text-slate-600">{info.message}</p>
                    <p className="mt-3 text-sm font-medium text-slate-800">Time: {formatDateTime(info.scheduledAt)} - {formatDateTime(info.endsAt)}</p>
                  </div>

                  <div className={`flex min-w-56 items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium ${toneClasses(info.tone)}`}>
                    <Icon size={16} />
                    {info.label}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <div className="text-sm text-slate-600">
                    {interviewStarted ? (
                      <Link
                        href={`/candidate/interviews/${item.application.id}`}
                        className="font-medium text-slate-700 transition hover:text-teal-700"
                      >
                        Questions: <span className="font-semibold text-slate-950">{questionCount}</span>
                      </Link>
                    ) : (
                      <span className="font-medium text-slate-700">
                        Questions will be available after the interview starts.
                      </span>
                    )}
                  </div>
                  <Button
                    asChild={info.canStart && !interviewStarted}
                    variant={info.canStart && !interviewStarted ? "primary" : "outline"}
                    disabled={!info.canStart || interviewStarted}
                  >
                    {info.canStart && !interviewStarted ? (
                      <Link href={`/candidate/interviews/${item.application.id}`}>
                        <Play size={16} /> Start Interview
                      </Link>
                    ) : interviewCompleted ? (
                      <>
                        <Icon size={16} /> Interview completed
                      </>
                    ) : interviewStarted ? (
                      <>
                        <Play size={16} /> Interview Started
                      </>
                    ) : (
                      <>
                        <Play size={16} /> {info.label}
                      </>
                    )}
                  </Button>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}
