import { loadSpec } from "../utils/specLoader.js";
import { sendEmail } from "../emails/resendClient.js";

export async function emailAgent(input) {
  const templates = loadSpec("email/templates.json");
  const subjectTemplate = input.shortlist.decision === "reject" ? templates.rejection_subject : templates.interview_subject;
  const subject = subjectTemplate.replace("{{role}}", input.hiringSpec.role);
  const result = await sendEmail({
    to: input.candidate.email,
    subject,
    text: `Hello ${input.candidate.name}, your application status is ${input.shortlist.decision}.`
  });
  return { success: true, data: result };
}
