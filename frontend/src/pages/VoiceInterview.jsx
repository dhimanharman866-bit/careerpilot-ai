import { useState, useRef, useEffect } from "react";
import api from "../services/api";

// ── AI Interviewer status derived from app state ──────────────────────────
function getInterviewerStatus(loadingQuestion, recording, loadingAnswer) {
  if (loadingQuestion) return { label: "Preparing", color: "text-zinc-400" };
  if (loadingAnswer)   return { label: "Processing", color: "text-amber-400" };
  if (recording)       return { label: "Listening",  color: "text-emerald-400" };
  return                      { label: "Asking Question", color: "text-blue-400" };
}

// ── Difficulty badge style ────────────────────────────────────────────────
function difficultyStyle(difficulty) {
  return (
    {
      easy:   "text-emerald-400 bg-emerald-950 border-emerald-800",
      medium: "text-violet-400  bg-violet-950  border-violet-800",
      hard:   "text-red-400     bg-red-950     border-red-800",
    }[difficulty?.toLowerCase()] ?? "text-violet-400 bg-violet-950 border-violet-800"
  );
}

// ── Score label ───────────────────────────────────────────────────────────
function scoreLabel(score) {
  if (score >= 8) return "Excellent answer";
  if (score >= 5) return "Good — some room to improve";
  return "Keep practising — you'll get there";
}

// ── Score ring colour ─────────────────────────────────────────────────────
function scoreRingColor(score) {
  if (score >= 8) return "border-emerald-500 text-emerald-400";
  if (score >= 5) return "border-amber-500   text-amber-400";
  return                 "border-red-500     text-red-400";
}

// ─────────────────────────────────────────────────────────────────────────
export default function VoiceInterview() {
  // ── Interview session state ──────────────────────────────────────────────
  const [sessionId,        setSessionId]        = useState(null);
  const [question,         setQuestion]         = useState("");
  const [questionId,       setQuestionId]       = useState(null);
  const [difficulty,       setDifficulty]       = useState("");
  const [questionNumber,   setQuestionNumber]   = useState(0);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [targetRole,       setTargetRole]       = useState("");

  // ── Recording state ──────────────────────────────────────────────────────
  const [recording,       setRecording]       = useState(false);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [loadingAnswer,   setLoadingAnswer]   = useState(false);

  // ── Timer state ──────────────────────────────────────────────────────────
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  // ── Response state ───────────────────────────────────────────────────────
  const [transcript,   setTranscript]   = useState("");
  const [score,        setScore]        = useState(null);
  const [feedback,     setFeedback]     = useState("");
  const [strengths,    setStrengths]    = useState("");
  const [improvements, setImprovements] = useState("");

  // ── Error state ──────────────────────────────────────────────────────────
  const [error, setError] = useState("");

  // ── Refs ─────────────────────────────────────────────────────────────────
  const mediaRecorderRef = useRef(null);
  const audioChunksRef   = useRef([]);
  const streamRef        = useRef(null);

  // ── Timer helpers ────────────────────────────────────────────────────────
  useEffect(() => {
    if (recording) {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [recording]);

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ── Step 1: Load the first question from the real backend ────────────────
  const loadFirstQuestion = async () => {
    setLoadingQuestion(true);
    setError("");

    const token = localStorage.getItem("token");

    try {
      const analysisResponse = await api.get("/resume/latest-analysis", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const analysisId = analysisResponse.data.analysis_id;

      const interviewResponse = await api.post(
        `/interview/generate-question/${analysisId}`,
        { target_role: targetRole.trim() || "Software Engineer", adaptive: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = interviewResponse.data;

      setSessionId(data.session_id);
      setQuestionId(data.question_id);
      setQuestion(data.question);
      setDifficulty(data.difficulty ?? "medium");
      setQuestionNumber(1);
      setInterviewStarted(true);

      setTranscript("");
      setScore(null);
      setFeedback("");
      setStrengths("");
      setImprovements("");
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(
        detail ??
          "Failed to load the first question. Make sure you have uploaded and analysed your resume."
      );
    } finally {
      setLoadingQuestion(false);
    }
  };

  // ── Step 2: Start microphone recording ──────────────────────────────────
  const startRecording = async () => {
    setError("");
    setTranscript("");
    setScore(null);
    setFeedback("");
    setStrengths("");
    setImprovements("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.start(250);
      setRecording(true);
    } catch (err) {
      setError(
        "Microphone access was denied. Please allow microphone access in your browser and try again."
      );
    }
  };

  // ── Step 3: Stop recording and submit ───────────────────────────────────
  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.stop();
    setRecording(false);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      await submitAudio(blob);
    };
  };

  // ── Step 4: POST audio to /interview/adaptive-voice-answer ───────────────
  const submitAudio = async (blob) => {
    if (!questionId) {
      setError("No active question ID. Please reload the first question.");
      return;
    }

    setLoadingAnswer(true);
    setError("");

    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("audio_file", blob, "answer.webm");

    try {
      const res = await api.post(
        `/interview/adaptive-voice-answer?question_id=${questionId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const data = res.data;

      setTranscript(data.transcript);
      setScore(data.score);
      setFeedback(data.feedback);
      setStrengths(data.strengths);
      setImprovements(data.improvements);

      setQuestion(data.next_question);
      setQuestionId(data.next_question_id);
      setDifficulty(data.difficulty ?? "medium");
      setQuestionNumber((prev) => prev + 1);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(detail ?? "Failed to process your answer. Please try again.");
    } finally {
      setLoadingAnswer(false);
    }
  };

  // ── Derived values ────────────────────────────────────────────────────────
  const status    = getInterviewerStatus(loadingQuestion, recording, loadingAnswer);
  const isPulsing = !loadingAnswer && !recording && interviewStarted;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-10 flex flex-col gap-6">

        {/* ── Page header ─────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Voice Interview
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Answer each question out loud. The AI evaluates your response and
              asks the next question automatically.
            </p>
          </div>

          {interviewStarted && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-zinc-500 font-medium">Q{questionNumber}</span>
              {difficulty && (
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${difficultyStyle(difficulty)}`}
                >
                  {difficulty}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Error banner ─────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-start gap-3 bg-red-950/60 border border-red-800/60 rounded-xl px-4 py-3.5 text-sm text-red-300">
            <span className="mt-0.5 shrink-0">⚠</span>
            <span>{error}</span>
          </div>
        )}

        {/* ── Pre-interview empty state ─────────────────────────────────── */}
        {!interviewStarted && (
          <div className="flex flex-col items-center gap-8 py-10">
            {/* AI Interviewer card (static, pre-interview) */}
            <div className="flex flex-col items-center gap-4">
              {/* Avatar */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-9 h-9 text-zinc-400"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M6 20c0-3.314 2.686-6 6-6s6 2.686 6 6" />
                  </svg>
                </div>
              </div>

              <div className="text-center">
                <p className="text-base font-semibold text-white">Alex</p>
                <p className="text-sm text-zinc-500">Senior Software Engineer</p>
                <p className="text-xs text-zinc-600 mt-1">AI Interviewer</p>
              </div>
            </div>

            <div className="text-center max-w-sm">
              <p className="text-sm text-zinc-400 leading-relaxed">
                When you're ready, click the button below. Alex will ask you a
                question tailored to your resume. Answer by recording your voice.
              </p>
            </div>

            {/* ── Target role selector ── */}
            <div className="w-full max-w-sm flex flex-col gap-3">
              <label
                htmlFor="target-role"
                className="text-xs text-zinc-500 uppercase tracking-widest font-semibold text-center"
              >
                Target Role
              </label>
              <input
                id="target-role"
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. ML Engineer, Frontend Developer…"
                className="
                  w-full bg-zinc-900 border border-zinc-700 rounded-xl
                  px-4 py-3 text-sm text-white placeholder-zinc-600
                  focus:outline-none focus:border-zinc-500
                  transition-colors duration-150
                "
              />
              {/* Quick-pick chips */}
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  "ML Engineer",
                  "Frontend Developer",
                  "Backend Engineer",
                  "Full Stack Developer",
                  "Data Scientist",
                  "Product Manager",
                ].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setTargetRole(role)}
                    className={`
                      px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors duration-150
                      ${
                        targetRole === role
                          ? "bg-zinc-700 border-zinc-500 text-white"
                          : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                      }
                    `}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={loadFirstQuestion}
              disabled={loadingQuestion}
              className="
                inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm
                bg-white text-zinc-900
                hover:bg-zinc-100 transition-colors duration-150
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {loadingQuestion ? (
                <>
                  <Spinner />
                  Loading Question…
                </>
              ) : (
                "Start Interview"
              )}
            </button>
          </div>
        )}

        {/* ── Active interview UI ──────────────────────────────────────── */}
        {interviewStarted && (
          <div className="flex flex-col gap-5">

            {/* ── AI Interviewer panel ── */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-5 flex items-center gap-5">
              {/* Avatar with optional pulse ring */}
              <div className="relative shrink-0">
                {isPulsing && (
                  <span className="absolute inset-0 rounded-full border-2 border-blue-500/40 animate-ping" />
                )}
                <div className="relative w-14 h-14 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-7 h-7 text-zinc-400"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M6 20c0-3.314 2.686-6 6-6s6 2.686 6 6" />
                  </svg>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-white">Alex</p>
                  <span className="text-zinc-600 text-xs">·</span>
                  <p className="text-xs text-zinc-500">Senior Software Engineer</p>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                    loadingAnswer ? "bg-amber-400" : recording ? "bg-emerald-400 animate-pulse" : "bg-blue-400"
                  }`} />
                  <span className={`text-xs font-medium ${status.color}`}>
                    {status.label}
                  </span>
                </div>
              </div>

              <span className="text-xs text-zinc-600 shrink-0">AI Interviewer</span>
            </div>

            {/* ── Question card ── */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-6">
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-4">
                Question {questionNumber}
              </p>
              <p className="text-lg text-white leading-relaxed font-normal">
                {question}
              </p>
            </div>

            {/* ── Recording controls ── */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-5">
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-4">
                Your Response
              </p>

              <div className="flex items-center gap-4">
                {!recording ? (
                  <button
                    onClick={startRecording}
                    disabled={loadingAnswer}
                    className="
                      flex items-center gap-2.5 px-5 py-3 rounded-xl font-semibold text-sm
                      bg-emerald-600 text-white hover:bg-emerald-500
                      transition-colors duration-150
                      disabled:opacity-40 disabled:cursor-not-allowed
                    "
                  >
                    <MicIcon />
                    Start Recording
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="
                      flex items-center gap-2.5 px-5 py-3 rounded-xl font-semibold text-sm
                      bg-red-600 text-white hover:bg-red-500
                      transition-colors duration-150
                    "
                  >
                    <StopIcon />
                    Stop Recording
                  </button>
                )}

                {/* Timer + indicator */}
                {recording && (
                  <div className="flex items-center gap-2 text-sm text-zinc-300">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="font-mono tabular-nums">{formatTime(elapsed)}</span>
                  </div>
                )}

                {!recording && !loadingAnswer && (
                  <p className="text-xs text-zinc-600">
                    Press Start Recording when you're ready to answer.
                  </p>
                )}
              </div>
            </div>

            {/* ── Processing state ── */}
            {loadingAnswer && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-5 flex items-center gap-4">
                <Spinner />
                <div>
                  <p className="text-sm font-medium text-white">Processing your answer…</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Transcribing and evaluating your response
                  </p>
                </div>
              </div>
            )}

            {/* ── Results ── */}
            {transcript && !loadingAnswer && (
              <div className="flex flex-col gap-4">

                {/* Divider label */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-zinc-800" />
                  <span className="text-xs text-zinc-600 font-medium uppercase tracking-widest">
                    Evaluation
                  </span>
                  <div className="flex-1 h-px bg-zinc-800" />
                </div>

                {/* Transcript */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-5">
                  <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-3">
                    Transcript
                  </p>
                  <p className="text-zinc-300 text-sm leading-7">{transcript}</p>
                </div>

                {/* Score */}
                {score !== null && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-5 flex items-center gap-5">
                    <div
                      className={`w-16 h-16 rounded-full border-2 flex flex-col items-center justify-center shrink-0 ${scoreRingColor(score)}`}
                    >
                      <span className="text-2xl font-bold leading-none">{score}</span>
                      <span className="text-xs text-zinc-500 mt-0.5">/10</span>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-1">
                        Score
                      </p>
                      <p className="text-sm text-zinc-300">{scoreLabel(score)}</p>
                    </div>
                  </div>
                )}

                {/* Feedback */}
                {feedback && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-5">
                    <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-3">
                      Feedback
                    </p>
                    <p className="text-zinc-300 text-sm leading-7">{feedback}</p>
                  </div>
                )}

                {/* Strengths + Improvements */}
                {(strengths || improvements) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {strengths && (
                      <div className="bg-zinc-900 border border-emerald-900/60 rounded-2xl px-6 py-5">
                        <p className="text-xs text-emerald-500 uppercase tracking-widest font-semibold mb-3">
                          Strengths
                        </p>
                        <p className="text-zinc-300 text-sm leading-7">{strengths}</p>
                      </div>
                    )}
                    {improvements && (
                      <div className="bg-zinc-900 border border-amber-900/60 rounded-2xl px-6 py-5">
                        <p className="text-xs text-amber-500 uppercase tracking-widest font-semibold mb-3">
                          To Improve
                        </p>
                        <p className="text-zinc-300 text-sm leading-7">{improvements}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Next question nudge */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 text-center">
                  <p className="text-sm text-zinc-400">
                    Next question is ready.{" "}
                    <span className="text-white font-medium">
                      Click Start Recording when you're ready.
                    </span>
                  </p>
                </div>

              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}

// ── Inline micro-components (no new files) ────────────────────────────────

function MicIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-4 h-4"
    >
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      className="w-4 h-4 animate-spin text-zinc-400 shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}