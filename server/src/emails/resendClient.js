import { Resend } from "resend";
import { env } from "../config/env.js";

export async function sendEmail(message) {
  if (!env.RESEND_API_KEY) {
    return { sent: false, provider: "resend", simulated: true, to: message.to, subject: message.subject };
  }
  const resend = new Resend(env.RESEND_API_KEY);
  const response = await resend.emails.send({
    from: "AgentHire <onboarding@resend.dev>",
    ...message
  });
  return { sent: true, provider: "resend", id: response.data?.id };
}
