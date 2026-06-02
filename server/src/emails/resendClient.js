import { Resend } from "resend";
import { env } from "../config/env.js";

export async function sendEmail(message) {
  if (!env.RESEND_API_KEY) {
    return { sent: false, provider: "resend", simulated: true, to: message.to, subject: message.subject };
  }
  const originalTo = message.to;
  const effectiveTo = env.RESEND_TEST_REDIRECT && env.RESEND_TEST_TO ? env.RESEND_TEST_TO : originalTo;
  const text = env.RESEND_TEST_REDIRECT && env.RESEND_TEST_TO
    ? `[AgentHire dev redirect]\nOriginal recipient: ${originalTo}\n\n${message.text || ""}`
    : message.text;
  const html = env.RESEND_TEST_REDIRECT && env.RESEND_TEST_TO && message.html
    ? `<p><strong>AgentHire dev redirect</strong></p><p>Original recipient: ${originalTo}</p>${message.html}`
    : message.html;
  const resend = new Resend(env.RESEND_API_KEY);
  const response = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    ...message,
    to: effectiveTo,
    text,
    html
  });
  if (response.error) {
    console.error(JSON.stringify({
      service: "resend",
      status: "failed",
      to: effectiveTo,
      original_to: originalTo,
      from: env.RESEND_FROM_EMAIL,
      subject: message.subject,
      error: {
        name: response.error.name,
        message: response.error.message,
        statusCode: response.error.statusCode
      },
      timestamp: new Date().toISOString()
    }));
    const error = new Error(response.error.message || "Resend email delivery failed");
    error.statusCode = 502;
    error.provider = "resend";
    error.details = {
      name: response.error.name,
      statusCode: response.error.statusCode
    };
    throw error;
  }
  if (!response.data?.id) {
    console.error(JSON.stringify({
      service: "resend",
      status: "failed",
      to: effectiveTo,
      original_to: originalTo,
      from: env.RESEND_FROM_EMAIL,
      subject: message.subject,
      error: { message: "Resend did not return an email id" },
      timestamp: new Date().toISOString()
    }));
    const error = new Error("Resend did not return an email id");
    error.statusCode = 502;
    error.provider = "resend";
    throw error;
  }
  console.log(JSON.stringify({
    service: "resend",
    status: "sent",
    id: response.data.id,
    to: effectiveTo,
    original_to: originalTo,
    redirected: effectiveTo !== originalTo,
    from: env.RESEND_FROM_EMAIL,
    subject: message.subject,
    timestamp: new Date().toISOString()
  }));
  return {
    sent: true,
    provider: "resend",
    id: response.data.id,
    from: env.RESEND_FROM_EMAIL,
    to: effectiveTo,
    original_to: originalTo,
    redirected: effectiveTo !== originalTo
  };
}
