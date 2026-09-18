import { useEffect, useState } from "react";
import {
  Trophy,
  Brain,
  Code,
  FolderGit2,
  Target,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import api from "../services/api";

const PlacementReadiness = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get("/placement/readiness", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReport(response.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load placement report.");
    } finally {
      setLoading(false);
    }
  };

  const badgeColor = () => {
    if (!report) return "";
    if (report.status === "Placement Ready") return "text-emerald-400 bg-emerald-950 border-emerald-800";
    if (report.status === "almost ready") return "text-amber-400 bg-amber-950 border-amber-800";
    return "text-red-400 bg-red-950 border-red-800";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-500 text-sm">
          <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Loading placement report…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="flex items-start gap-3 bg-red-950/60 border border-red-800/60 rounded-xl px-5 py-4 text-sm text-red-300 max-w-sm">
          <span className="mt-0.5 shrink-0">⚠</span>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-10 flex flex-col gap-5">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Placement Readiness
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Your career readiness based on resume and interview performance.
          </p>
        </div>

        {/* Hero score card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-8 flex flex-col items-center gap-3 text-center">
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Readiness Score</p>
          <p className="text-6xl font-bold text-white">{report.readiness_score}<span className="text-2xl text-zinc-500">%</span></p>
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${badgeColor()}`}>
            {report.status}
          </span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4">
            <Code className="text-blue-400 mb-2" size={18} />
            <p className="text-xs text-zinc-500 mb-1">Skills</p>
            <p className="text-2xl font-bold text-white">{report.skill_count}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4">
            <FolderGit2 className="text-violet-400 mb-2" size={18} />
            <p className="text-xs text-zinc-500 mb-1">Projects</p>
            <p className="text-2xl font-bold text-white">{report.project_count}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4">
            <Brain className="text-emerald-400 mb-2" size={18} />
            <p className="text-xs text-zinc-500 mb-1">Interview Score</p>
            <p className="text-2xl font-bold text-white">{report.average_interview_score}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4">
            <Target className="text-amber-400 mb-2" size={18} />
            <p className="text-xs text-zinc-500 mb-1">Readiness</p>
            <p className="text-2xl font-bold text-white">{report.readiness_score}%</p>
          </div>
        </div>

        {/* AI Career Summary */}
        {report.ai_report && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-5">
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-3 flex items-center gap-2">
              <Trophy size={13} className="text-amber-400" />
              AI Career Summary
            </p>
            <p className="text-sm text-zinc-300 leading-7">{report.ai_report.summary}</p>
          </div>
        )}

        {/* Strengths + Weaknesses */}
        {report.ai_report && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-900 border border-emerald-900/60 rounded-2xl px-6 py-5">
              <p className="text-xs text-emerald-500 uppercase tracking-widest font-semibold mb-3">
                Strengths
              </p>
              <div className="space-y-2">
                {report.ai_report.strengths.map((item, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm text-zinc-300">
                    <CheckCircle className="text-emerald-500 mt-0.5 shrink-0" size={14} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-zinc-900 border border-amber-900/60 rounded-2xl px-6 py-5">
              <p className="text-xs text-amber-500 uppercase tracking-widest font-semibold mb-3">
                Weaknesses
              </p>
              <div className="space-y-2">
                {report.ai_report.weaknesses.map((item, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm text-zinc-300">
                    <AlertTriangle className="text-amber-400 mt-0.5 shrink-0" size={14} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {report.ai_report && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-5">
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-3">
              Recommendations
            </p>
            <div className="space-y-2">
              {report.ai_report.recommendations.map((item, index) => (
                <div key={index} className="flex items-start gap-2.5 text-sm text-zinc-300 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3">
                  <span className="text-zinc-500 shrink-0 mt-0.5">→</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Roadmap */}
        {report.ai_report && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-5">
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-4">
              30-Day Roadmap
            </p>
            <div className="space-y-5">
              {report.ai_report.roadmap.map((item, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <div className="w-2 h-2 rounded-full bg-zinc-600 mt-1" />
                    {index < report.ai_report.roadmap.length - 1 && (
                      <div className="w-px flex-1 bg-zinc-800" />
                    )}
                  </div>
                  <div className="pb-2">
                    <p className="text-sm font-semibold text-white mb-0.5">{item.week}</p>
                    <p className="text-sm text-zinc-400 leading-relaxed">{item.goal}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PlacementReadiness;