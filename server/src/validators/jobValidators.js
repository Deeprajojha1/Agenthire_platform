import { z } from "zod";

export const createJobSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(10),
  required_skills: z.array(z.string().min(1)).default([]),
  preferred_skills: z.array(z.string().min(1)).default([]),
  min_experience: z.coerce.number().min(0).default(0),
  workflow_spec_id: z.string().default("default-hiring-workflow"),
  hiring_spec_id: z.string().default("frontend-developer")
});

export const updateJobSchema = createJobSchema.partial();
