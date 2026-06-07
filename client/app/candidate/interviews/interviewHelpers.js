import { CheckCircle2, Clock3, HelpCircle, Play } from "lucide-react";

export function formatDateTime(value) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function interviewInfo(item, now) {
  const workflow = item.workflow;
  const scheduledAt = workflow?.interview_scheduled_at || workflow?.context?.interviewScheduledAt || null;
  const material = workflow?.context?.interview || null;
  if (!scheduledAt) {
    return {
      label: "Interview not scheduled",
      message: "The interview time will appear here after recruiter approval.",
      tone: "slate",
      Icon: HelpCircle,
      scheduledAt,
      material,
      canStart: false
    };
  }
  const interviewTime = new Date(scheduledAt).getTime();
  if (interviewTime > now) {
    return {
      label: "Upcoming interview",
      message: "The interview is scheduled. The start button will unlock at the scheduled time.",
      tone: "amber",
      Icon: Clock3,
      scheduledAt,
      material,
      canStart: false
    };
  }
  if (material) {
    return {
      label: "Interview ready",
      message: "The interview time has started. Open the questions to begin.",
      tone: "teal",
      Icon: Play,
      scheduledAt,
      material,
      canStart: true
    };
  }
  return {
    label: "Interview completed",
    message: "The interview time has passed, but questions have not been generated yet.",
    tone: "emerald",
    Icon: CheckCircle2,
    scheduledAt,
    material,
    canStart: false
  };
}

export function toneClasses(tone) {
  return {
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    teal: "border-teal-200 bg-teal-50 text-teal-800",
    slate: "border-slate-200 bg-slate-50 text-slate-700"
  }[tone] || "border-slate-200 bg-slate-50 text-slate-700";
}
