import Candidate from "../../models/Candidate.js";
import Notification from "../../models/Notification.js";
import User from "../../models/User.js";

const eventMessages = {
  application_submitted: "Your application has been submitted.",
  resume_parsed: "Your resume has been parsed.",
  embedding_completed: "Your resume profile is ready for matching.",
  matching_completed: "Your profile matching is complete.",
  shortlisting_completed: "Your application screening is complete.",
  waiting_for_recruiter_review: "Your profile is under recruiter review.",
  interview_generated: "Interview questions generated.",
  email_sent: "Application email update sent.",
  application_rejected: "Application rejected.",
  application_approved: "Application shortlisted."
};

let socketServer = null;

export function setCandidateSocketServer(io) {
  socketServer = io;
}

function titleForEvent(event) {
  return event.split("_").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");
}

export async function publishCandidateEvent({ candidateId, workflowId, event, payload = {} }) {
  const candidate = await Candidate.findById(candidateId);
  if (!candidate) return null;

  const user = await User.findOne({ email: candidate.email, role: "candidate" });
  const message = eventMessages[event] || titleForEvent(event);
  let notification = null;

  if (user) {
    notification = await Notification.create({
      user_id: user._id,
      candidate_id: candidate._id,
      workflow_id: workflowId,
      event,
      title: titleForEvent(event),
      message,
      type: event === "interview_generated" ? "interview_update" : "workflow_update"
    });
  }

  socketServer?.to(`application:${candidate._id}`).emit("workflow:update", {
    event,
    message,
    candidate_id: candidate._id,
    workflow_id: workflowId,
    notification,
    ...payload
  });

  return notification;
}
