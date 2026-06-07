import { loadSpec } from "../utils/specLoader.js";
import { sendEmail } from "../emails/resendClient.js";

function formatDate(value) {
  if (!value) return "To be shared";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeZone: "Asia/Kolkata"
  }).format(new Date(value));
}

function formatTime(value) {
  if (!value) return "To be shared";
  return new Intl.DateTimeFormat("en-IN", {
    timeStyle: "short",
    timeZone: "Asia/Kolkata"
  }).format(new Date(value));
}

function replaceTokens(template, values) {
  return Object.entries(values).reduce((content, [key, value]) => content.replaceAll(`{{${key}}}`, value ?? ""), template);
}

function shellHtml({ title, bannerColor, bannerText, bodyHtml, ctaLabel, ctaUrl, supportEmail }) {
  return `
    <div style="margin:0;padding:0;background:#f4f7f7;font-family:Arial,sans-serif;color:#0f172a;">
      <div style="max-width:640px;margin:0 auto;padding:28px 16px;">
        <div style="padding:16px 20px;background:#0f766e;color:#ffffff;border-radius:10px 10px 0 0;font-size:20px;font-weight:700;">AgentHire</div>
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-top:0;padding:24px;">
          <div style="background:${bannerColor};border-radius:8px;padding:12px 14px;margin-bottom:20px;font-weight:700;">${bannerText}</div>
          <h1 style="font-size:22px;line-height:1.3;margin:0 0 16px;">${title}</h1>
          ${bodyHtml}
          <div style="margin:24px 0;">
            <a href="${ctaUrl}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700;">${ctaLabel}</a>
          </div>
        </div>
        <div style="padding:16px 20px;background:#e2e8f0;border-radius:0 0 10px 10px;font-size:12px;color:#475569;">
          <p style="margin:0 0 6px;">AgentHire Team</p>
          <p style="margin:0 0 6px;">Support: ${supportEmail}</p>
          <p style="margin:0;">Copyright ${new Date().getFullYear()} AgentHire. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;
}

function interviewEmail(input, templates) {
  const interviewLink = `${process.env.CLIENT_ORIGIN || "http://localhost:3000"}/candidate/interviews`;
  const values = {
    candidateName: input.candidate.name,
    name: input.candidate.name,
    role: input.hiringSpec.role,
    interviewDate: formatDate(input.interviewScheduledAt),
    interviewTime: formatTime(input.interviewScheduledAt),
    interviewMode: templates.mode || "Online",
    interviewLink
  };
  const text = replaceTokens(templates.body, values);
  const html = shellHtml({
    title: `Interview invitation for ${values.role}`,
    bannerColor: "#dbeafe",
    bannerText: "Interview stage",
    ctaLabel: templates.cta_label || "Join Interview",
    ctaUrl: interviewLink,
    supportEmail: templates.support_email || "support@agenthire.local",
    bodyHtml: `
      <p>Hello ${values.candidateName},</p>
      <p><strong>Congratulations!</strong></p>
      <p>We are pleased to inform you that your application for the <strong>${values.role}</strong> position has been shortlisted for the next stage of our hiring process.</p>
      <h2 style="font-size:16px;margin-top:20px;">Interview Details</h2>
      <p><strong>Date:</strong> ${values.interviewDate}</p>
      <p><strong>Time:</strong> ${values.interviewTime}</p>
      <p><strong>Mode:</strong> ${values.interviewMode}</p>
      <p>During this round, we may discuss your technical skills, projects, problem-solving approach, and experience relevant to the role.</p>
      <ul><li>Join the interview on time.</li><li>Have a stable internet connection.</li><li>Keep your resume and project details ready.</li></ul>
    `
  });
  return { text, html, subject: replaceTokens(templates.subject, values) };
}

function selectionEmail(input, templates) {
  const onboardingLink = `${process.env.CLIENT_ORIGIN || "http://localhost:3000"}/candidate/dashboard`;
  const joiningDate = formatDate(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const values = {
    candidateName: input.candidate.name,
    name: input.candidate.name,
    role: input.hiringSpec.role,
    joiningDate,
    onboardingLink
  };
  const text = replaceTokens(templates.body, values);
  const html = shellHtml({
    title: `Congratulations on your ${values.role} selection`,
    bannerColor: "#dcfce7",
    bannerText: "Selection confirmed",
    ctaLabel: templates.cta_label || "Complete Onboarding",
    ctaUrl: onboardingLink,
    supportEmail: templates.support_email || "support@agenthire.local",
    bodyHtml: `
      <p>Hello ${values.candidateName},</p>
      <p><strong>Congratulations!</strong></p>
      <p>We are delighted to inform you that you have successfully cleared the interview process and have been selected for the <strong>${values.role}</strong> position.</p>
      <p>Your performance demonstrated strong technical skills, problem-solving ability, and enthusiasm for learning.</p>
      <h2 style="font-size:16px;margin-top:20px;">Next Steps</h2>
      <ul><li>Review the onboarding details.</li><li>Complete any required documentation.</li><li>Expected Joining Date: ${joiningDate}</li></ul>
      <p>Further instructions will be shared with you shortly.</p>
    `
  });
  return { text, html, subject: replaceTokens(templates.subject, values) };
}

export async function emailAgent(input) {
  const isSelection = input.recruiterReview?.decision === "advance";
  const isFinalRejection = ["reject", "hold"].includes(input.recruiterReview?.decision);
  const templates = input.shortlist.decision === "rejected" || isFinalRejection
    ? loadSpec("email/rejection.json")
    : isSelection
      ? loadSpec("email/selection.json")
      : loadSpec("email/interview-invite.json");
  const rendered = isSelection ? selectionEmail(input, templates) : input.shortlist.decision === "rejected" || isFinalRejection
    ? {
        subject: templates.subject.replace("{{role}}", input.hiringSpec.role),
        text: templates.body.replaceAll("{{name}}", input.candidate.name).replaceAll("{{role}}", input.hiringSpec.role),
        html: undefined
      }
    : interviewEmail(input, templates);
  const result = await sendEmail({
    to: input.candidate.email,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html
  });
  return { success: true, data: { ...result, subject: rendered.subject, text: rendered.text, html: rendered.html } };
}
