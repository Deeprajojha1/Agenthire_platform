# Interview Workflow Specification

## Purpose

The interview workflow defines how recruiter approval, interview scheduling, candidate interview access, generated interview questions, coding tasks, and email notifications work together in AgentHire.

## Recruiter Approval And Scheduling

- When a workflow reaches the `human_approval` checkpoint, the recruiter must approve or reject the candidate.
- If the recruiter approves the candidate, the recruiter must set an interview date and time before the approval is submitted.
- The selected interview time is persisted on the workflow as `interview_scheduled_at`.
- The same time is also stored in workflow context as `interviewScheduledAt` so later workflow agents can use it.
- If the recruiter rejects the candidate, the workflow completes as rejected and no interview time is required.

## Interview Agent

- The `interview_agent` runs only after recruiter approval.
- It receives the role, interview rounds, match result, and parsed resume context.
- It generates interview material that can include:
  - interview questions
  - a coding task
  - an evaluation rubric
- Generated interview material is stored in workflow context as `context.interview`.

## Candidate Interview States

Candidate interview UI must show one of these states:

- `Interview not scheduled`: no interview time has been set yet.
- `Upcoming interview`: an interview time exists, but the scheduled time has not arrived.
- `Interview ready`: the scheduled time has arrived and generated interview material exists.
- `Interview completed`: the scheduled time has passed, but interview material is not available.

## Candidate Access Rules

- The candidate portal includes an `Interviews` navigation item.
- The interviews list shows each application with its interview state, scheduled time, and question count.
- Clicking the question count opens the dedicated interview questions page for that application.
- The questions page must not redirect to the application details page.
- Questions and coding material remain locked until the scheduled interview time.
- Once the scheduled time arrives and material is available, the candidate can view interview questions, the coding task, and the evaluation rubric.
- Interview difficulty is selected by the recruiter during interview scheduling.
- Candidates can view the assigned difficulty, but they cannot change it.
- Technical questions must be based on the candidate's parsed resume skills, job required skills, job preferred skills, and role.
- Coding questions must be generated according to the difficulty policy and should target the candidate's relevant frontend, backend, database, or general engineering skills.

## Coding Task Editor

- Coding tasks use the built-in Monaco code editor.
- The editor is loaded only on the interview questions page.
- The editor supports JavaScript, TypeScript, and Python starter code.
- The editor is intended for candidate coding answers during the interview task.

## Voice Interview Support

- Candidate interview sessions can request AI interviewer voice for each question.
- Question text is sent to Murf AI through the configured text-to-speech endpoint.
- If Murf AI fails or no API key is configured, the interview must continue with the text question.
- Candidate voice answers are recorded in the browser and uploaded to the server.
- Uploaded recordings are stored under `server/interviews`.
- Recordings are sent to AssemblyAI for transcription when an API key is configured.
- If AssemblyAI fails or no API key is configured, the interview must continue with the candidate's manual text answer.
- Stored answer data includes raw transcript, clean transcript, confidence score, recording path, manual fallback text, code submission, answer timestamp, and duration.

## Email Notification

- The email agent sends an interview invitation after approval and interview material generation.
- The interview invitation email includes the scheduled interview time.
- Rejection emails do not require interview timing.

## Current Implementation Notes

- The recruiter approval modal is implemented in `client/app/dashboard/workflows/page.js`.
- Candidate interview list is implemented in `client/app/candidate/interviews/page.js`.
- Candidate interview questions page is implemented in `client/app/candidate/interviews/[id]/page.js`.
- Shared interview state logic is implemented in `client/app/candidate/interviews/interviewHelpers.js`.
- Candidate interview APIs are implemented under `/candidate/interviews/...`.
- Interview session persistence is implemented in `server/src/models/Interview.js`.
- Murf AI and AssemblyAI wrappers are implemented in `server/src/services/interview/voiceService.js`.
- Interview orchestration is implemented in `server/src/services/interview/interviewService.js`.
- Backend approval persistence is implemented in `server/src/services/workflowService.js`.
- Candidate interview data is exposed through `server/src/services/candidate/portalService.js`.
- Interview email timing is added in `server/src/agents/emailAgent.js`.
