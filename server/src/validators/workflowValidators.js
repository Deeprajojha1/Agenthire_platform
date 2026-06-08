import { z } from "zod";

export const startWorkflowSchema = z.object({
  candidate_id: z.string().min(1),
  job_id: z.string().min(1)
});

export const retryWorkflowSchema = z.object({
  workflow_id: z.string().min(1)
});

export const approveWorkflowSchema = z.object({
  workflow_id: z.string().min(1),
  approved: z.preprocess((value) => value === "true" ? true : value === "false" ? false : value, z.boolean()),
  interview_scheduled_at: z.string().datetime().optional(),
  interview_ends_at: z.string().datetime().optional(),
  interview_difficulty: z.enum(["starter", "standard", "advanced", "expert"]).optional(),
  interview_question_count: z.preprocess((value) => value === "" || value == null ? undefined : Number(value), z.number().int().min(1).max(50).optional()),
  preferred_language: z.string().trim().min(1).max(40).optional()
}).superRefine((value, ctx) => {
  if (value.approved && !value.interview_scheduled_at) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["interview_scheduled_at"],
      message: "Interview time is required when approving a workflow"
    });
  }
  if (value.approved && !value.interview_ends_at) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["interview_ends_at"],
      message: "Interview end time is required when approving a workflow"
    });
  }
  if (value.approved && value.interview_scheduled_at && value.interview_ends_at) {
    const start = new Date(value.interview_scheduled_at).getTime();
    const end = new Date(value.interview_ends_at).getTime();
    if (!Number.isFinite(end) || end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["interview_ends_at"],
        message: "Interview end time must be after the start time"
      });
    }
  }
  if (value.approved && !value.interview_difficulty) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["interview_difficulty"],
      message: "Interview difficulty is required when approving a workflow"
    });
  }
});

export const recruiterReviewSchema = z.object({
  workflow_id: z.string().min(1),
  decision: z.enum(["advance", "hold", "reject"]),
  note: z.string().max(1000).optional()
});
