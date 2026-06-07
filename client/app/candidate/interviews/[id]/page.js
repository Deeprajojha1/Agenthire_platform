"use client";

import dynamic from "next/dynamic";
import { ArrowLeft, CalendarClock, CheckCircle2, Mic, Send, Square, Volume2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "../../../../components/ui/Button.js";
import { PageLoader } from "../../../../components/ui/PageLoader.js";
import { Textarea } from "../../../../components/ui/Textarea.js";
import { api } from "../../../../lib/api.js";
import { formatDateTime, interviewInfo, toneClasses } from "../interviewHelpers.js";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-80 items-center justify-center rounded-md border border-slate-200 bg-slate-950 text-sm text-slate-300">
      Loading code editor...
    </div>
  )
});

const starterCode = {
  javascript: `function solution() {\n  // Write your answer here\n}\n`,
  typescript: `function solution(): void {\n  // Write your answer here\n}\n`,
  python: `def solution():\n    # Write your answer here\n    pass\n`
};

export default function CandidateInterviewQuestionsPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params?.id;
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(0);
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(starterCode.javascript);
  const [micReady, setMicReady] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [interview, setInterview] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [manualText, setManualText] = useState("");
  const [audioBlob, setAudioBlob] = useState(null);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const startedAtRef = useRef(0);

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    api("/candidate/notifications")
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  function changeLanguage(nextLanguage) {
    setLanguage(nextLanguage);
    setCode(starterCode[nextLanguage] || "");
  }

  async function startInterviewSession() {
    setBusy(true);
    setStatusMessage("");
    try {
      const result = await api(`/candidate/interviews/${applicationId}/start`, {
        method: "POST",
        body: JSON.stringify({
          difficulty: fixedDifficulty,
          preferred_language: language,
          microphone_ready: micReady,
          camera_ready: cameraReady
        })
      });
      setInterview(result.interview);
      setCurrentIndex(0);
    } catch (err) {
      setStatusMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function loadQuestionAudio(question) {
    if (!interview || !question) return;
    setBusy(true);
    setStatusMessage("");
    try {
      const result = await api(`/candidate/interviews/session/${interview._id}/questions/${question.id}/audio`, { method: "POST" });
      const nextQuestion = result.question;
      setInterview((current) => ({
        ...current,
        questions: current.questions.map((item) => item.id === nextQuestion.id ? nextQuestion : item)
      }));
      if (nextQuestion.audio_url) {
        new Audio(nextQuestion.audio_url).play().catch(() => setStatusMessage("Audio playback was blocked. Please use the text question."));
      } else {
        setStatusMessage("Voice audio is unavailable. Please use the text question.");
      }
    } catch (err) {
      setStatusMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function testDevice(kind) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(kind === "camera" ? { video: true } : { audio: true });
      stream.getTracks().forEach((track) => track.stop());
      if (kind === "camera") setCameraReady(true);
      if (kind === "microphone") setMicReady(true);
    } catch {
      setStatusMessage(`${kind === "camera" ? "Camera" : "Microphone"} test failed. You can continue with manual text answers.`);
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        setAudioBlob(new Blob(chunksRef.current, { type: "audio/webm" }));
      };
      recorderRef.current = recorder;
      startedAtRef.current = Date.now();
      recorder.start();
      setRecording(true);
    } catch {
      setStatusMessage("Recording failed. Please type your answer manually.");
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  async function submitCurrentAnswer() {
    const question = interview?.questions?.[currentIndex];
    if (!interview || !question) return;
    setBusy(true);
    setStatusMessage("");
    try {
      const form = new FormData();
      form.set("question_id", question.id);
      form.set("manual_text", manualText);
      form.set("language", language);
      form.set("duration", startedAtRef.current ? String(Math.round((Date.now() - startedAtRef.current) / 1000)) : "0");
      if (question.type === "coding") form.set("code", code);
      if (audioBlob) form.set("recording", audioBlob, `${question.id}.webm`);
      await api(`/candidate/interviews/session/${interview._id}/answers`, { method: "POST", body: form });
      setManualText("");
      setAudioBlob(null);
      if (currentIndex < interview.questions.length - 1) {
        setCurrentIndex((value) => value + 1);
      } else {
        const result = await api(`/candidate/interviews/session/${interview._id}/complete`, { method: "POST" });
        setInterview(result.interview);
        setStatusMessage("Interview completed. Your answers and evaluation summary were saved.");
      }
    } catch (err) {
      setStatusMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  const item = data?.applications?.find((application) => String(application.application.id) === String(applicationId));
  const info = item ? interviewInfo(item, now) : null;
  const Icon = info?.Icon;
  const activeQuestion = interview?.questions?.[currentIndex];
  const fixedDifficulty = item?.interview?.difficulty || item?.workflow?.interview_difficulty || item?.workflow?.context?.interviewDifficulty || info?.difficulty || "standard";

  useEffect(() => {
    if (!item?.interview || interview) return;
    setInterview(item.interview);
    const nextLanguage = item.interview.preferred_language || "javascript";
    setLanguage(nextLanguage);
    setCode(starterCode[nextLanguage] || "");
    setCurrentIndex(Math.min(item.interview.answers?.length || 0, Math.max((item.interview.questions?.length || 1) - 1, 0)));
  }, [interview, item]);

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
            aria-label="Go back"
          >
            <ArrowLeft size={16} />
          </button>
          <p className="text-sm font-medium text-teal-700">Interview Questions</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">{item?.application?.job?.title || "Interview"}</h1>
        </div>
      </div>

      {!data && !error && <PageLoader label="Loading questions..." className="min-h-80" />}
      {error && <p className="mt-6 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {data && !item && (
        <div className="mt-6 rounded-md border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
          Interview application was not found.
        </div>
      )}

      {item && info && (
        <div className="mt-6 space-y-5">
          <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-teal-700">
                  <CalendarClock size={16} />
                  Time: {formatDateTime(info.scheduledAt)}
                </div>
                <h2 className="mt-2 text-lg font-semibold text-slate-950">{info.label}</h2>
                <p className="mt-1 text-sm text-slate-600">{info.message}</p>
              </div>
              <div className={`flex min-w-56 items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium ${toneClasses(info.tone)}`}>
                {Icon && <Icon size={16} />}
                {info.label}
              </div>
            </div>
          </section>

          {!info.canStart && (
            <section className="rounded-md border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
              Questions will open here after the scheduled interview time.
            </section>
          )}

          {info.canStart && (
            <section className="space-y-5 rounded-md border border-slate-200 bg-white p-5 shadow-sm">
              {!interview && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-950">Interview Setup</h2>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="text-sm font-medium text-slate-700">
                        Difficulty
                        <div className="mt-2 flex h-10 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-semibold capitalize text-slate-800">
                          {fixedDifficulty}
                        </div>
                      </div>
                      <label className="text-sm font-medium text-slate-700">
                        Preferred language
                        <select value={language} onChange={(event) => changeLanguage(event.target.value)} className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100">
                          <option value="javascript">JavaScript</option>
                          <option value="typescript">TypeScript</option>
                          <option value="python">Python</option>
                        </select>
                      </label>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button type="button" variant={micReady ? "primary" : "outline"} onClick={() => testDevice("microphone")}>Microphone Test</Button>
                      <Button type="button" variant={cameraReady ? "primary" : "outline"} onClick={() => testDevice("camera")}>Camera Test</Button>
                      <Button type="button" onClick={startInterviewSession} disabled={busy || !micReady || !cameraReady}>
                        {busy ? "Starting..." : "Ready and Start"}
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                    <h2 className="text-lg font-semibold text-slate-950">Before You Start</h2>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div className="flex gap-3 rounded-md bg-white p-3 text-sm text-slate-700">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
                        <span>Enable your microphone and complete the microphone test.</span>
                      </div>
                      <div className="flex gap-3 rounded-md bg-white p-3 text-sm text-slate-700">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
                        <span>Enable your camera and complete the camera test.</span>
                      </div>
                      <div className="flex gap-3 rounded-md bg-white p-3 text-sm text-slate-700">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
                        <span>Use a stable internet connection and stay on this page during the interview.</span>
                      </div>
                      <div className="flex gap-3 rounded-md bg-white p-3 text-sm text-slate-700">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
                        <span>Keep your resume, project details, and coding environment ready.</span>
                      </div>
                      <div className="flex gap-3 rounded-md bg-white p-3 text-sm text-slate-700 md:col-span-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
                        <span>Answer each question clearly. If voice transcription is unavailable, type your answer manually.</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {interview && activeQuestion && interview.status !== "completed" && (
                <div className="space-y-5">
                  {Array.isArray(interview.questions) && interview.questions.length > 0 && (
                    <div>
                      <h2 className="text-lg font-semibold text-slate-950">AI Asked Questions</h2>
                      <div className="mt-3 grid gap-2 md:grid-cols-2">
                        {interview.questions.map((question, index) => (
                          <button
                            key={question.id}
                            type="button"
                            onClick={() => setCurrentIndex(index)}
                            className={`rounded-md border p-3 text-left text-sm transition ${index === currentIndex ? "border-teal-300 bg-teal-50 text-teal-900" : "border-slate-200 bg-slate-50 text-slate-700 hover:border-teal-200 hover:bg-teal-50/60"}`}
                          >
                            <span className="font-semibold text-slate-950">Q{index + 1}.</span> {question.prompt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase text-slate-500">Question {currentIndex + 1} of {interview.questions.length}</p>
                    <h2 className="mt-2 text-lg font-semibold capitalize text-slate-950">{activeQuestion.type} Question</h2>
                    <p className="mt-3 text-sm leading-6 text-slate-700">{activeQuestion.prompt}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button type="button" variant="outline" onClick={() => loadQuestionAudio(activeQuestion)} disabled={busy}>
                        <Volume2 size={16} /> Play Question
                      </Button>
                      {!recording && <Button type="button" variant="outline" onClick={startRecording}><Mic size={16} /> Record Answer</Button>}
                      {recording && <Button type="button" variant="danger" onClick={stopRecording}><Square size={16} /> Stop Recording</Button>}
                      {audioBlob && <span className="inline-flex h-10 items-center rounded-md bg-emerald-50 px-3 text-sm font-medium text-emerald-700">Recording ready</span>}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Manual Answer Fallback</h3>
                    <Textarea className="mt-2 min-h-32" value={manualText} onChange={(event) => setManualText(event.target.value)} placeholder="Type your answer if voice transcription is unavailable or you prefer text." />
                  </div>

                  {activeQuestion.type === "coding" && (
                    <div>
                      <h2 className="text-lg font-semibold text-slate-950">Coding Task</h2>
                      <p className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">{activeQuestion.coding_task || activeQuestion.prompt}</p>
                      <div className="mt-4 overflow-hidden rounded-md border border-slate-200">
                        <div className="flex flex-col gap-3 border-b border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm font-semibold text-slate-900">Code Editor</p>
                          <select value={language} onChange={(event) => changeLanguage(event.target.value)} className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-100">
                            <option value="javascript">JavaScript</option>
                            <option value="typescript">TypeScript</option>
                            <option value="python">Python</option>
                          </select>
                        </div>
                        <MonacoEditor
                          height="420px"
                          language={language}
                          theme="vs-dark"
                          value={code}
                          onChange={(value) => setCode(value || "")}
                          options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            lineNumbers: "on",
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            tabSize: 2,
                            wordWrap: "on"
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <Button type="button" onClick={submitCurrentAnswer} disabled={busy}>
                    <Send size={16} /> {currentIndex < interview.questions.length - 1 ? "Submit and Next" : "Submit and Complete"}
                  </Button>
                </div>
              )}

              {interview?.status === "completed" && (
                <div className="space-y-4">
                  <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                    Interview completed. Overall score: {interview.overall_score ?? "Pending"} - Recommendation: {interview.recommendation || "Pending recruiter review"}
                  </div>
                  {Array.isArray(interview.questions) && interview.questions.length > 0 && (
                    <div>
                      <h2 className="text-lg font-semibold text-slate-950">AI Asked Questions</h2>
                      <div className="mt-3 space-y-2">
                        {interview.questions.map((question, index) => (
                          <div key={question.id} className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                            <p><span className="font-semibold text-slate-950">Q{index + 1}.</span> {question.prompt}</p>
                            {interview.answers?.find((answer) => answer.question_id === question.id)?.clean_transcript && (
                              <p className="mt-2 text-slate-600">Answer: {interview.answers.find((answer) => answer.question_id === question.id).clean_transcript}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {statusMessage && <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">{statusMessage}</p>}
            </section>
          )}

          <Button type="button" variant="outline" onClick={() => router.push("/candidate/interviews")}>Back to interviews</Button>
        </div>
      )}
    </>
  );
}
