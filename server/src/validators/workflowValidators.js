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
  approved: z.boolean(),
  interview_scheduled_at: z.string().datetime().optional(),
  interview_difficulty: z.enum(["starter", "standard", "advanced"]).optional()
}).superRefine((value, ctx) => {
  if (value.approved && !value.interview_scheduled_at) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["interview_scheduled_at"],
      message: "Interview time is required when approving a workflow"
    });
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
