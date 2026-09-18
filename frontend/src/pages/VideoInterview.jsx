import { useState, useRef, useEffect } from "react";
import api from "../services/api";

// ── Helpers ───────────────────────────────────────────────────────────────
function difficultyStyle(difficulty) {
  return (
    {
      easy:   "text-emerald-400 bg-emerald-950/60 border-emerald-800/60",
      medium: "text-sky-400     bg-sky-950/60     border-sky-800/60",
      hard:   "text-red-400     bg-red-950/60     border-red-800/60",
    }[difficulty?.toLowerCase()] ?? "text-sky-400 bg-sky-950/60 border-sky-800/60"
  );
}

function scoreLabel(score) {
  if (score >= 8) return "Excellent answer";
  if (score >= 5) return "Good — some room to improve";
  return "Keep practising — you'll get there";
}

function scoreRingColor(score) {
  if (score >= 8) return "border-emerald-500 text-emerald-400";
  if (score >= 5) return "border-amber-500 text-amber-400";
  return "border-red-500 text-red-400";
}

// ─────────────────────────────────────────────────────────────────────────
export default function VideoInterview() {
  // ── Session state ────────────────────────────────────────────────────────
  const [sessionId,        setSessionId]        = useState(null);
  const [question,         setQuestion]         = useState("");
  const [questionId,       setQuestionId]       = useState(null);
  const [difficulty,       setDifficulty]       = useState("");
  const [questionNumber,   setQuestionNumber]   = useState(0);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [targetRole,       setTargetRole]       = useState("");

  // ── Recording stage ──────────────────────────────────────────────────────
  // "idle" | "recording" | "preview"
  const [recordingStage, setRecordingStage] = useState("idle");

  // ── Loading ──────────────────────────────────────────────────────────────
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [loadingAnswer,   setLoadingAnswer]   = useState(false);

  // ── Timer ────────────────────────────────────────────────────────────────
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  // ── Evaluation state ─────────────────────────────────────────────────────
  const [transcript,   setTranscript]   = useState("");
  const [score,        setScore]        = useState(null);
  const [feedback,     setFeedback]     = useState("");
  const [strengths,    setStrengths]    = useState([]);
  const [improvements, setImprovements] = useState([]);

  // ── Error ────────────────────────────────────────────────────────────────
  const [error, setError] = useState("");

  // ── Refs ─────────────────────────────────────────────────────────────────
  const liveVideoRef = useRef(null);
  const streamRef    = useRef(null);
  const recorderRef  = useRef(null);
  const chunksRef    = useRef([]);
  const videoBlobRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState("");

  // cleanup object URL on unmount
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  // timer
  useEffect(() => {
    if (recordingStage === "recording") {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [recordingStage]);

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const releaseStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (liveVideoRef.current) liveVideoRef.current.srcObject = null;
  };

  const clearEvaluation = () => {
    setTranscript(""); setScore(null); setFeedback("");
    setStrengths([]); setImprovements([]);
  };

  const toText = (val) => Array.isArray(val) ? val.join("\n") : val ?? "";

  // ── Step 1: load first question ──────────────────────────────────────────
  const loadFirstQuestion = async () => {
    setLoadingQuestion(true);
    setError("");
    const token = localStorage.getItem("token");
    try {
      const { data: aData } = await api.get("/resume/latest-analysis", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { data: iData } = await api.post(
        `/interview/generate-question/${aData.analysis_id}`,
        { target_role: targetRole.trim() || "Software Engineer", adaptive: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSessionId(iData.session_id);
      setQuestionId(iData.question_id);
      setQuestion(iData.question);
      setDifficulty(iData.difficulty ?? "medium");
      setQuestionNumber(1);
      setInterviewStarted(true);
      clearEvaluation();
    } catch (err) {
      setError(
        err.response?.data?.detail ??
          "Failed to load the first question. Make sure you have uploaded and analysed your resume."
      );
    } finally {
      setLoadingQuestion(false);
    }
  };

  // ── Step 2: open camera + start recording ────────────────────────────────
  const openCameraAndRecord = async () => {
    setError("");
    clearEvaluation();
    if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(""); }
    videoBlobRef.current = null;
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
        await liveVideoRef.current.play();
      }

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : MediaRecorder.isTypeSupported("video/webm") ? "video/webm" : "";

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        videoBlobRef.current = blob;
        setPreviewUrl(URL.createObjectURL(blob));
        releaseStream();
        setRecordingStage("preview");
      };

      recorder.start(250);
      setRecordingStage("recording");
    } catch {
      setError("Camera or microphone access was denied. Please allow access in your browser and try again.");
    }
  };

  // ── Step 3: stop recording ───────────────────────────────────────────────
  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    recorderRef.current = null;
  };

  // ── Step 4: submit video ─────────────────────────────────────────────────
  const submitVideoAnswer = async () => {
    if (!videoBlobRef.current || !questionId) return;
    setLoadingAnswer(true);
    setError("");
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("video_file", videoBlobRef.current, "answer.webm");
    try {
      const { data: d } = await api.post(
        `/interview/adaptive-video-answer?question_id=${questionId}`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
      );
      setTranscript(d.transcript);
      setScore(d.score);
      setFeedback(d.feedback);
      setStrengths(d.strengths ?? []);
      setImprovements(d.improvements ?? []);
      setQuestion(d.next_question);
      setQuestionId(d.next_question_id);
      setDifficulty(d.difficulty ?? "medium");
      setQuestionNumber((prev) => prev + 1);
      setRecordingStage("idle");
    } catch (err) {
      setError(err.response?.data?.detail ?? "Failed to process your answer. Please try again.");
    } finally {
      setLoadingAnswer(false);
    }
  };

  // ── Status derived values ────────────────────────────────────────────────
  const statusLabel = loadingAnswer ? "Processing your answer…"
    : recordingStage === "recording" ? "Recording your response"
    : recordingStage === "preview"   ? "Review your recording"
    : transcript                      ? "Next question ready"
    :                                   "Waiting for your response";

  const statusDot = loadingAnswer      ? "bg-amber-400 animate-pulse"
    : recordingStage === "recording"   ? "bg-red-500 animate-pulse"
    : recordingStage === "preview"     ? "bg-zinc-500"
    : transcript                        ? "bg-emerald-500"
    :                                    "bg-sky-500";

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-6">

        {/* ── Page header ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Video Interview</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              Answer on camera — the AI evaluates your response and asks the next question.
            </p>
          </div>
          {interviewStarted && (
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-xs text-zinc-500 font-medium tabular-nums">
                Q{questionNumber}
              </span>
              {difficulty && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${difficultyStyle(difficulty)}`}>
                  {difficulty}
                </span>
              )}
              <div className="flex items-center gap-1.5 pl-2 border-l border-zinc-800">
                <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                <span className="text-xs text-zinc-400">{statusLabel}</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Error banner ─────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-start gap-3 bg-red-950/50 border border-red-800/50 rounded-xl px-4 py-3 text-sm text-red-300">
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* ── Pre-interview setup ──────────────────────────────────────── */}
        {!interviewStarted && (
          <div className="max-w-lg mx-auto w-full flex flex-col gap-6 py-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-6 flex flex-col gap-5">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-1">
                  Target Role
                </p>
                <input
                  id="target-role-video"
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. ML Engineer, Frontend Developer…"
                  className="
                    w-full bg-zinc-950 border border-zinc-800 rounded-xl
                    px-4 py-3 text-sm text-white placeholder-zinc-600
                    focus:outline-none focus:border-zinc-600 transition-colors duration-150
                  "
                />
                <div className="flex flex-wrap gap-2 mt-3">
                  {["ML Engineer", "Frontend Developer", "Backend Engineer", "Full Stack", "Data Scientist", "Product Manager"].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setTargetRole(role)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors duration-150
                        ${targetRole === role
                          ? "bg-zinc-700 border-zinc-600 text-white"
                          : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                        }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-5">
                <p className="text-xs text-zinc-500 leading-relaxed mb-4">
                  Your camera and microphone will open when you start.
                  Recording begins immediately — answer naturally, then click Stop.
                </p>
                <button
                  onClick={loadFirstQuestion}
                  disabled={loadingQuestion}
                  className="
                    w-full flex items-center justify-center gap-2
                    py-3 rounded-xl font-semibold text-sm
                    bg-white text-zinc-900 hover:bg-zinc-100
                    transition-colors duration-150
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  {loadingQuestion ? <><Spinner /> Generating question…</> : "Start Interview"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Active interview: side-by-side layout ────────────────────── */}
        {interviewStarted && (
          <div className="flex flex-col gap-5">

            {/* Two-column grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

              {/* ── LEFT — AI panel + question ── */}
              <div className="flex flex-col gap-4">

                {/* AI header */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 flex items-center gap-4">
                  {/* Avatar with status ring */}
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                      <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <circle cx="12" cy="8" r="4" />
                        <path d="M6 20c0-3.314 2.686-6 6-6s6 2.686 6 6" strokeLinecap="round" />
                      </svg>
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-zinc-900 ${
                      recordingStage === "recording" ? "bg-red-500" : "bg-sky-500"
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">Alex</p>
                    <p className="text-xs text-zinc-500">AI Interviewer · Senior Software Engineer</p>
                  </div>
                  <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest shrink-0">
                    AI
                  </span>
                </div>

                {/* Question */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-6 flex-1">
                  <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold mb-4">
                    Question {questionNumber}
                  </p>
                  <p className="text-xl text-white leading-relaxed font-normal">
                    {question}
                  </p>
                </div>

                {/* Processing state — shown in left column while submitting */}
                {loadingAnswer && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 flex items-center gap-3">
                    <Spinner />
                    <div>
                      <p className="text-sm font-medium text-white">Processing your answer…</p>
                      <p className="text-xs text-zinc-500 mt-0.5">Transcribing and evaluating your response</p>
                    </div>
                  </div>
                )}

                {/* Next question nudge — shown after evaluation */}
                {transcript && !loadingAnswer && recordingStage === "idle" && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-3.5">
                    <p className="text-xs text-zinc-400">
                      Next question is loaded.{" "}
                      <span className="text-white font-medium">
                        Click Start Recording when ready.
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* ── RIGHT — Camera panel ── */}
              <div className="flex flex-col gap-3">

                {/* Video viewport */}
                <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden aspect-video">

                  {/* Live camera feed — visible only while recording */}
                  <video
                    ref={liveVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover transition-opacity duration-200 ${
                      recordingStage === "recording" ? "opacity-100" : "opacity-0 absolute inset-0"
                    }`}
                  />

                  {/* Recording complete placeholder */}
                  {recordingStage === "preview" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-white">Recording complete</p>
                      <p className="text-xs text-zinc-500">Submit your answer or re-record below</p>
                    </div>
                  )}

                  {/* Idle placeholder */}
                  {recordingStage === "idle" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <svg className="w-8 h-8 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                      </svg>
                      <p className="text-xs text-zinc-600">Camera inactive</p>
                    </div>
                  )}

                  {/* Recording indicator — top-left overlay */}
                  {recordingStage === "recording" && (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-xs font-mono font-semibold text-white tabular-nums">
                        {formatTime(elapsed)}
                      </span>
                    </div>
                  )}

                  {/* Preview label — top-left overlay */}
                  {recordingStage === "preview" && (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1">
                      <span className="text-xs font-medium text-zinc-300">Preview</span>
                    </div>
                  )}
                </div>

                {/* Controls below camera */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 flex items-center gap-3">

                  {/* Idle: start recording */}
                  {recordingStage === "idle" && !loadingAnswer && (
                    <button
                      onClick={openCameraAndRecord}
                      className="
                        flex-1 flex items-center justify-center gap-2
                        py-2.5 rounded-xl text-sm font-semibold
                        bg-white text-zinc-900 hover:bg-zinc-100
                        transition-colors duration-150
                      "
                    >
                      <CameraIcon />
                      {transcript ? "Record Next Answer" : "Start Recording"}
                    </button>
                  )}

                  {/* Recording: stop */}
                  {recordingStage === "recording" && (
                    <button
                      onClick={stopRecording}
                      className="
                        flex-1 flex items-center justify-center gap-2
                        py-2.5 rounded-xl text-sm font-semibold
                        bg-red-600 text-white hover:bg-red-500
                        transition-colors duration-150
                      "
                    >
                      <StopIcon />
                      Stop Recording
                    </button>
                  )}

                  {/* Preview: submit + re-record */}
                  {recordingStage === "preview" && !loadingAnswer && (
                    <>
                      <button
                        onClick={submitVideoAnswer}
                        className="
                          flex-1 flex items-center justify-center gap-2
                          py-2.5 rounded-xl text-sm font-semibold
                          bg-white text-zinc-900 hover:bg-zinc-100
                          transition-colors duration-150
                        "
                      >
                        Submit Answer
                      </button>
                      <button
                        onClick={openCameraAndRecord}
                        className="
                          px-4 py-2.5 rounded-xl text-sm text-zinc-400
                          border border-zinc-700 hover:border-zinc-600 hover:text-zinc-200
                          transition-colors duration-150
                        "
                      >
                        Re-record
                      </button>
                    </>
                  )}

                  {/* Loading state */}
                  {loadingAnswer && (
                    <div className="flex-1 flex items-center justify-center gap-2 py-2.5">
                      <Spinner />
                      <span className="text-sm text-zinc-500">Evaluating…</span>
                    </div>
                  )}
                </div>

                {/* Camera tip */}
                {recordingStage === "idle" && !loadingAnswer && (
                  <p className="text-xs text-zinc-600 text-center px-1">
                    Recording starts immediately when you click the button above.
                  </p>
                )}
              </div>
            </div>

            {/* ── Evaluation results — full width below the grid ── */}
            {transcript && !loadingAnswer && (
              <div className="flex flex-col gap-4 pt-2">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-zinc-800" />
                  <span className="text-[10px] text-zinc-600 font-semibold uppercase tracking-widest">
                    Evaluation — Question {questionNumber - 1}
                  </span>
                  <div className="flex-1 h-px bg-zinc-800" />
                </div>

                {/* Score + Transcript row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                  {/* Score */}
                  {score !== null && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-5 flex flex-col items-center justify-center gap-3 text-center">
                      <div className={`w-16 h-16 rounded-full border-2 flex flex-col items-center justify-center ${scoreRingColor(score)}`}>
                        <span className="text-2xl font-bold leading-none">{score}</span>
                        <span className="text-[10px] text-zinc-500 mt-0.5">/10</span>
                      </div>
                      <p className="text-xs text-zinc-400">{scoreLabel(score)}</p>
                    </div>
                  )}

                  {/* Transcript */}
                  <div className={`bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-5 ${score !== null ? "lg:col-span-2" : "lg:col-span-3"}`}>
                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold mb-3">Transcript</p>
                    <p className="text-zinc-300 text-sm leading-7">{transcript}</p>
                  </div>
                </div>

                {/* Feedback */}
                {feedback && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-5">
                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold mb-3">Feedback</p>
                    <p className="text-zinc-300 text-sm leading-7">{feedback}</p>
                  </div>
                )}

                {/* Strengths + Improvements */}
                {(strengths.length > 0 || improvements.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {strengths.length > 0 && (
                      <div className="bg-zinc-900 border border-emerald-900/50 rounded-2xl px-6 py-5">
                        <p className="text-[10px] text-emerald-500 uppercase tracking-widest font-semibold mb-3">Strengths</p>
                        <p className="text-zinc-300 text-sm leading-7">{toText(strengths)}</p>
                      </div>
                    )}
                    {improvements.length > 0 && (
                      <div className="bg-zinc-900 border border-amber-900/50 rounded-2xl px-6 py-5">
                        <p className="text-[10px] text-amber-500 uppercase tracking-widest font-semibold mb-3">To Improve</p>
                        <p className="text-zinc-300 text-sm leading-7">{toText(improvements)}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────
function CameraIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14" />
      <rect x="3" y="8" width="12" height="8" rx="2" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
