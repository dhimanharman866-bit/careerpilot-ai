import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const InterviewHistory = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await api.get("/interview/history", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory(response.data.history);
    } catch (error) {
      console.log(error);
      alert("Unable to load interview history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-500 text-sm">
          <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Loading history…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-10 flex flex-col gap-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Interview History
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Review your past AI interview sessions.
          </p>
        </div>

        {/* Empty state */}
        {history.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-16 text-center">
            <p className="text-sm font-medium text-white mb-1">No interviews yet</p>
            <p className="text-sm text-zinc-500">
              Complete your first AI interview to see results here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map((item) => (
              <div
                key={item.session_id}
                onClick={() => navigate(`/interview-summary/${item.session_id}`)}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-5 cursor-pointer hover:border-zinc-600 transition-colors duration-150"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-white truncate">
                      {item.target_role}
                    </h2>
                    <p className="text-xs text-zinc-500 mt-1">
                      {new Date(item.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-bold text-white">
                      {item.average_score}
                      <span className="text-sm text-zinc-500 font-normal">/10</span>
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">Avg Score</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default InterviewHistory;