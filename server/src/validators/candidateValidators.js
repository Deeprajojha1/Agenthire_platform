import { z } from "zod";

export const uploadCandidateSchema = z.object({
  job_id: z.string().min(1),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().default("")
});

export const checkApplicationSchema = z.object({
  job_id: z.string().min(1),
  email: z.string().email()
});
