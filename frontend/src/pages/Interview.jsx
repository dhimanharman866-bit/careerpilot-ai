import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

const Interview = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchInterview = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await api.get(`/interview/session/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInterview(response.data);
    } catch (error) {
      console.log(error);
      alert("Failed to load interview.");
    }
  };

  useEffect(() => {
    fetchInterview();
  }, []);

  const handleSubmit = async () => {
    if (!answer.trim()) {
      alert("Please enter an answer.");
      return;
    }
    const token = localStorage.getItem("token");
    setSubmitting(true);
    try {
      const current = interview.questions[currentQuestion];
      await api.post(
        "/interview/answer",
        { question_id: current.id, answer: answer },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (currentQuestion < interview.questions.length - 1) {
        setCurrentQuestion((prev) => prev + 1);
        setAnswer("");
      } else {
        navigate(`/interview-summary/${sessionId}`);
      }
    } catch (error) {
      console.log(error);
      alert("Failed to submit answer.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!interview) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-500 text-sm">
          <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Loading Interview…
        </div>
      </div>
    );
  }

  const total = interview.questions.length;
  const current = interview.questions[currentQuestion];
  const difficultyStyle = {
    easy:   "text-emerald-400 bg-emerald-950 border-emerald-800",
    medium: "text-violet-400 bg-violet-950 border-violet-800",
    hard:   "text-red-400 bg-red-950 border-red-800",
  }[current.difficulty?.toLowerCase()] ?? "text-violet-400 bg-violet-950 border-violet-800";

  const isLast = currentQuestion === total - 1;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-10 flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              {interview.target_role} Interview
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              AI-generated interview based on your resume.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-zinc-500 font-medium">
              Q{currentQuestion + 1}/{total}
            </span>
            {current.difficulty && (
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${difficultyStyle}`}>
                {current.difficulty}
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-zinc-500 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / total) * 100}%` }}
          />
        </div>

        {/* Question card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-6">
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-4">
            Question {currentQuestion + 1}
          </p>
          <p className="text-lg text-white leading-relaxed">
            {current.question}
          </p>
        </div>

        {/* Answer */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-5">
          <label className="text-xs text-zinc-500 uppercase tracking-widest font-semibold block mb-3">
            Your Answer
          </label>
          <textarea
            rows="7"
            placeholder="Type your answer here…"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors resize-none"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
        </div>

        {/* Submit */}
        <button
          className="w-full py-3.5 rounded-xl bg-white text-zinc-900 font-semibold text-sm hover:bg-zinc-100 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting
            ? "Submitting…"
            : isLast
            ? "Finish Interview"
            : "Submit & Next Question"}
        </button>

      </div>
    </div>
  );
};

export default Interview;