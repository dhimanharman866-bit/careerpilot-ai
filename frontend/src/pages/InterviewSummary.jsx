import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";

const InterviewSummary = () => {
  const { sessionId } = useParams();
  const [report, setReport] = useState(null);

  const fetchReport = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await api.get(`/interview/report/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReport(response.data);
    } catch (error) {
      console.log(error);
      alert("Failed to load interview report.");
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  if (!report) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-500 text-sm">
          <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Loading report…
        </div>
      </div>
    );
  }

  const scoreColor = report.overall_score >= 8
    ? "border-emerald-500 text-emerald-400"
    : report.overall_score >= 5
    ? "border-amber-500 text-amber-400"
    : "border-red-500 text-red-400";

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-10 flex flex-col gap-5">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Interview Report
          </h1>
          <p className="text-sm text-zinc-500 mt-1">{report.target_role} Interview</p>
        </div>

        {/* Overall score */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-5 flex items-center gap-5">
          <div className={`w-16 h-16 rounded-full border-2 flex flex-col items-center justify-center shrink-0 ${scoreColor}`}>
            <span className="text-2xl font-bold leading-none">{report.overall_score}</span>
            <span className="text-xs text-zinc-500 mt-0.5">/10</span>
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-1">Overall Score</p>
            <p className="text-sm text-zinc-300">
              Placement Readiness:{" "}
              <span className="text-white font-medium">{report.overall_feedback.placement_readiness}</span>
            </p>
          </div>
        </div>

        {/* Overall Summary */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-5">
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-3">Summary</p>
          <p className="text-sm text-zinc-300 leading-7">{report.overall_feedback.summary}</p>
        </div>

        {/* Technical Strengths + Communication Strengths */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-zinc-900 border border-emerald-900/60 rounded-2xl px-6 py-5">
            <p className="text-xs text-emerald-500 uppercase tracking-widest font-semibold mb-3">
              Technical Strengths
            </p>
            {report.overall_feedback.technical_strengths.length > 0 ? (
              <ul className="space-y-2">
                {report.overall_feedback.technical_strengths.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-zinc-300">
                    <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-500">No major technical strengths identified.</p>
            )}
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-5">
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-3">
              Communication Strengths
            </p>
            {report.overall_feedback.communication_strengths.length > 0 ? (
              <ul className="space-y-2">
                {report.overall_feedback.communication_strengths.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-zinc-300">
                    <span className="text-zinc-400 mt-0.5 shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-500">No major communication strengths identified.</p>
            )}
          </div>
        </div>

        {/* Areas to Improve */}
        <div className="bg-zinc-900 border border-amber-900/60 rounded-2xl px-6 py-5">
          <p className="text-xs text-amber-500 uppercase tracking-widest font-semibold mb-3">
            Areas to Improve
          </p>
          <ul className="space-y-2">
            {report.overall_feedback.areas_to_improve.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-zinc-300">
                <span className="text-amber-500 mt-0.5 shrink-0">→</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Recommended Topics */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-5">
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-3">
            Recommended Topics
          </p>
          <div className="flex flex-wrap gap-2">
            {report.overall_feedback.recommended_topics.map((topic, index) => (
              <span
                key={index}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>

        {/* Section divider */}
        <div className="flex items-center gap-3 pt-2">
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="text-xs text-zinc-600 font-medium uppercase tracking-widest">
            Question-wise Feedback
          </span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        {/* Question Feedback */}
        <div className="flex flex-col gap-4">
          {report.question_feedback.map((item, index) => {
            const qScoreColor = item.score >= 8
              ? "border-emerald-500 text-emerald-400"
              : item.score >= 5
              ? "border-amber-500 text-amber-400"
              : "border-red-500 text-red-400";

            return (
              <div key={index} className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-5">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">
                    Question {index + 1}
                  </p>
                  <div className="flex items-center gap-3">
                    {item.difficulty && (
                      <span className="text-xs text-zinc-500 capitalize">{item.difficulty}</span>
                    )}
                    <span className={`text-sm font-bold ${qScoreColor.split(" ")[1]}`}>
                      {item.score}/10
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-zinc-500 font-semibold uppercase tracking-widest mb-1.5">Question</p>
                    <p className="text-sm text-zinc-300 leading-relaxed">{item.question}</p>
                  </div>
                  <div className="h-px bg-zinc-800" />
                  <div>
                    <p className="text-xs text-zinc-500 font-semibold uppercase tracking-widest mb-1.5">Your Answer</p>
                    <p className="text-sm text-zinc-300 leading-relaxed">{item.user_answer}</p>
                  </div>
                  <div className="h-px bg-zinc-800" />
                  <div>
                    <p className="text-xs text-zinc-500 font-semibold uppercase tracking-widest mb-1.5">AI Feedback</p>
                    <p className="text-sm text-zinc-300 leading-relaxed">{item.feedback}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default InterviewSummary;