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

export const updateCandidateSchema = z.object({
  name: z.string().trim().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().trim().optional(),
  status: z.enum(["submitted", "shortlist", "rejected", "hold", "hired", "reject"]).optional(),
  match_score: z.preprocess(
    (value) => value === "" || value == null ? undefined : Number(value),
    z.number().min(0).max(100).optional()
  )
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one candidate field is required"
});
