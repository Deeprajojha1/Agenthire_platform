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
  approved: z.boolean()
});
