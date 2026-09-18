import { useState, useEffect } from "react";
import {
  FiCheckCircle,
  FiAlertCircle,
  FiFolder,
  FiCode,
  FiZap
} from "react-icons/fi";
import api from "../services/api";

const ResumeAnalysis = () => {
  const [analysis, setAnalysis] = useState(null);

  const fetchAnalysis = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await api.get("/resume/latest-analysis", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnalysis(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, []);

  if (!analysis) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-500 text-sm">
          <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Loading Resume Analysis…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-10 flex flex-col gap-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Resume Analysis
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            AI-powered analysis of your latest resume.
          </p>
        </div>

        {/* Score card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-8 flex items-center gap-6">
          <div className="w-20 h-20 rounded-full border-2 border-violet-500 flex flex-col items-center justify-center shrink-0">
            <span className="text-2xl font-bold text-violet-400 leading-none">{analysis.score}</span>
            <span className="text-xs text-zinc-500 mt-0.5">/100</span>
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-1">Resume Score</p>
            <p className="text-base font-semibold text-white">
              {analysis.score >= 80
                ? "Excellent Resume"
                : analysis.score >= 60
                ? "Good Resume"
                : "Needs Improvement"}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              AI-powered assessment of your resume quality
            </p>
          </div>
        </div>

        {/* Grid — Skills + Projects */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Skills */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-5">
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-4 flex items-center gap-2">
              <FiCode className="text-blue-400" />
              Skills
            </p>
            <div className="flex flex-wrap gap-2">
              {analysis.skills.map((skill, index) => (
                <span
                  key={index}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Projects */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-5">
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-4 flex items-center gap-2">
              <FiFolder className="text-violet-400" />
              Projects
            </p>
            <div className="space-y-2">
              {analysis.projects.map((project, index) => (
                <div
                  key={index}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-300"
                >
                  {project}
                </div>
              ))}
            </div>
          </div>

          {/* Strengths */}
          <div className="bg-zinc-900 border border-emerald-900/60 rounded-2xl px-6 py-5">
            <p className="text-xs text-emerald-500 uppercase tracking-widest font-semibold mb-4 flex items-center gap-2">
              <FiCheckCircle />
              Strengths
            </p>
            <div className="space-y-2">
              {analysis.strengths.map((strength, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 text-sm text-zinc-300"
                >
                  <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                  {strength}
                </div>
              ))}
            </div>
          </div>

          {/* Weaknesses */}
          <div className="bg-zinc-900 border border-amber-900/60 rounded-2xl px-6 py-5">
            <p className="text-xs text-amber-500 uppercase tracking-widest font-semibold mb-4 flex items-center gap-2">
              <FiAlertCircle />
              Areas to Improve
            </p>
            <div className="space-y-2">
              {analysis.weaknesses.map((weakness, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 text-sm text-zinc-300"
                >
                  <span className="text-amber-500 mt-0.5 shrink-0">→</span>
                  {weakness}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* AI Suggestions */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-5">
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-4 flex items-center gap-2">
            <FiZap className="text-violet-400" />
            AI Suggestions
          </p>
          <div className="space-y-2">
            <div className="flex items-start gap-2.5 text-sm text-zinc-300 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3">
              <span className="text-zinc-500 shrink-0">💡</span>
              Add measurable achievements to every project.
            </div>
            <div className="flex items-start gap-2.5 text-sm text-zinc-300 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3">
              <span className="text-zinc-500 shrink-0">💡</span>
              Add GitHub repository links to projects.
            </div>
            <div className="flex items-start gap-2.5 text-sm text-zinc-300 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3">
              <span className="text-zinc-500 shrink-0">💡</span>
              Add professional certifications.
            </div>
            <div className="flex items-start gap-2.5 text-sm text-zinc-300 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3">
              <span className="text-zinc-500 shrink-0">💡</span>
              Improve your resume summary with stronger action verbs.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ResumeAnalysis;