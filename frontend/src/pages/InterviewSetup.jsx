import { useState } from "react";
import api from "../services/api";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const InterviewSetup = () => {
  const [targetRole, setTargetRole] = useState("");
  const [adaptive, setAdaptive] = useState(false);
  const navigate = useNavigate();

  const handleStartInterview = async () => {
    const token = localStorage.getItem("token");
    try {
      const analysisResponse = await api.get("/resume/latest-analysis", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const analysisId = analysisResponse.data.analysis_id;
      const interviewResponse = await api.post(
        `/interview/generate-question/${analysisId}`,
        { target_role: targetRole, adaptive: adaptive },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate(`/interview/${interviewResponse.data.session_id}`);
    } catch (error) {
      console.log(error);
      alert("Unable to start Interview");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-10 flex flex-col gap-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            AI Mock Interview
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Configure your interview before getting started.
          </p>
        </div>

        {/* Resume status */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 flex items-center gap-3">
          <span className="text-emerald-500 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-medium text-white">Resume Ready</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              AI will generate personalized questions using your resume, projects, and skills.
            </p>
          </div>
        </div>

        {/* Setup form */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-6 flex flex-col gap-6">

          {/* Target Role */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">
              Target Role
            </label>
            <input
              type="text"
              placeholder="e.g. Backend Developer"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
            />
          </div>

          {/* Adaptive */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">
              Adaptive Difficulty
            </label>
            <select
              value={adaptive}
              onChange={(e) => setAdaptive(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-zinc-600 transition-colors appearance-none"
            >
              <option>Yes</option>
              <option>No</option>
            </select>
          </div>

          {/* Interview Type (commented out in original — preserved) */}
          {/* <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">
              Interview Type
            </label>
            <select
              value={interviewType}
              onChange={(e) => setInterviewType(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-zinc-600 transition-colors"
            >
              <option>Technical</option>
              <option>HR</option>
              <option>Mixed</option>
            </select>
          </div> */}

          <button
            className="w-full py-3.5 rounded-xl bg-white text-zinc-900 font-semibold text-sm hover:bg-zinc-100 transition-colors duration-150 mt-1"
            onClick={handleStartInterview}
          >
            Start Interview
          </button>

        </div>

      </div>
    </div>
  );
};

export default InterviewSetup;