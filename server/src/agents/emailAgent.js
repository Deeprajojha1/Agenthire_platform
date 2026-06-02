import { loadSpec } from "../utils/specLoader.js";
import { sendEmail } from "../emails/resendClient.js";

export async function emailAgent(input) {
  const templates = input.shortlist.decision === "rejected"
    ? loadSpec("email/rejection.json")
    : loadSpec("email/interview-invite.json");
  const subjectTemplate = templates.subject;
  const subject = subjectTemplate.replace("{{role}}", input.hiringSpec.role);
  const text = templates.body
    .replaceAll("{{name}}", input.candidate.name)
    .replaceAll("{{role}}", input.hiringSpec.role);
  const result = await sendEmail({
    to: input.candidate.email,
    subject,
    text
  });
  return { success: true, data: { ...result, subject, text } };
}
