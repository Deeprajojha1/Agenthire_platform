import { z } from "zod";

const optionalDate = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? null : value),
  z.coerce.date().nullable().optional()
);

export const createJobSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(10),
  required_skills: z.array(z.string().min(1)).default([]),
  preferred_skills: z.array(z.string().min(1)).default([]),
  min_experience: z.coerce.number().min(0).default(0),
  application_deadline: optionalDate,
  workflow_spec_id: z.string().default("default-hiring-workflow"),
  hiring_spec_id: z.string().default("frontend-developer")
});

export const updateJobSchema = createJobSchema.partial();
