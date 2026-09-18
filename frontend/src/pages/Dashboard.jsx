import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Mic,
  Video,
  TrendingUp,
  Award,
  BarChart2,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import api from "../services/api";

// ── Utility ───────────────────────────────────────────────────────────────
function formatDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function scoreColor(score) {
  if (score === null || score === undefined) return "text-zinc-400";
  if (score >= 8) return "text-emerald-400";
  if (score >= 5) return "text-amber-400";
  return "text-red-400";
}

// ── Inline SVG line chart ─────────────────────────────────────────────────
function SparkChart({ data }) {
  const W = 600, H = 160, PAD = 24;

  const scores = useMemo(() => data.map((d) => d.average_score), [data]);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;

  const pts = scores.map((s, i) => {
    const x = PAD + (i / Math.max(scores.length - 1, 1)) * (W - PAD * 2);
    const y = H - PAD - ((s - min) / range) * (H - PAD * 2);
    return [x, y];
  });

  const linePath = pts
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`)
    .join(" ");

  const areaPath =
    linePath +
    ` L ${pts[pts.length - 1][0]} ${H - PAD} L ${pts[0][0]} ${H - PAD} Z`;

  // Y-axis grid labels
  const gridLines = [0, 0.5, 1].map((t) => ({
    y: H - PAD - t * (H - PAD * 2),
    label: (min + t * range).toFixed(1),
  }));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-40"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {gridLines.map(({ y }) => (
        <line
          key={y}
          x1={PAD}
          y1={y}
          x2={W - PAD}
          y2={y}
          stroke="#27272a"
          strokeWidth="1"
        />
      ))}

      {/* Area fill */}
      <path d={areaPath} fill="url(#area-grad)" />

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke="#a78bfa"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Data points */}
      {pts.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="4" fill="#18181b" stroke="#a78bfa" strokeWidth="2" />
        </g>
      ))}

      {/* X labels */}
      {data.map((d, i) => {
        const [x] = pts[i];
        return (
          <text
            key={i}
            x={x}
            y={H - 4}
            textAnchor="middle"
            fontSize="10"
            fill="#71717a"
          >
            {`#${i + 1}`}
          </text>
        );
      })}

      {/* Y labels */}
      {gridLines.map(({ y, label }) => (
        <text
          key={y}
          x={PAD - 6}
          y={y + 4}
          textAnchor="end"
          fontSize="10"
          fill="#52525b"
        >
          {label}
        </text>
      ))}
    </svg>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, title, value, sub, valueClass = "text-white" }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">
          {title}
        </p>
        {Icon && <Icon className="w-4 h-4 text-zinc-600" strokeWidth={1.5} />}
      </div>
      {value !== null && value !== undefined ? (
        <>
          <p className={`text-3xl font-bold leading-none ${valueClass}`}>
            {value}
          </p>
          {sub && <p className="text-xs text-zinc-500">{sub}</p>}
        </>
      ) : (
        <p className="text-sm text-zinc-600 mt-1">No data yet</p>
      )}
    </div>
  );
}

// ── Interview type card ────────────────────────────────────────────────────
function InterviewTypeCard({ icon: Icon, title, description, onClick }) {
  return (
    <div
      onClick={onClick}
      className="
        group bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-6
        flex flex-col gap-4 cursor-pointer
        hover:border-zinc-600 transition-colors duration-150
      "
    >
      <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
        <Icon className="w-4 h-4 text-zinc-300" strokeWidth={1.5} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{description}</p>
      </div>
      <button
        className="
          w-full flex items-center justify-center gap-2
          py-2.5 rounded-xl text-xs font-semibold
          bg-zinc-800 border border-zinc-700 text-zinc-200
          group-hover:bg-zinc-700 group-hover:border-zinc-600
          transition-colors duration-150
        "
      >
        Start Interview
        <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingDash, setLoadingDash] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    api
      .get("/dashboard", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setDashboard(r.data))
      .catch(() => {})
      .finally(() => setLoadingDash(false));

    api
      .get("/interview/history", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setHistory(r.data.history ?? []))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, []);

  const recentHistory = history.slice(0, 5);

  // Chart needs at least 2 data points with non-zero scores
  const chartData = history.filter((h) => h.average_score > 0);
  const showChart = chartData.length >= 2;

  if (loadingDash) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-500 text-sm">
          <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Loading…
        </div>
      </div>
    );
  }

  const username = dashboard?.username ?? "there";
  const interviewsCompleted = history.length;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col gap-10">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Welcome back, {username}.
          </h1>
          <p className="text-sm text-zinc-500">
            Track your interview preparation and career readiness.
          </p>
        </div>

        {/* ── KPI Cards ───────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          <p className="text-xs text-zinc-600 uppercase tracking-widest font-semibold">
            Overview
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard
              icon={FileText}
              title="Resume Score"
              value={dashboard?.resume_score ?? null}
              sub="out of 100"
              valueClass="text-white"
            />
            <KpiCard
              icon={CheckCircle}
              title="Interviews Completed"
              value={interviewsCompleted > 0 ? interviewsCompleted : null}
              sub={interviewsCompleted === 1 ? "session" : "sessions"}
            />
            <KpiCard
              icon={BarChart2}
              title="Avg Interview Score"
              value={
                dashboard?.interview_score !== null &&
                dashboard?.interview_score !== undefined
                  ? `${dashboard.interview_score}`
                  : null
              }
              sub="out of 10"
              valueClass={scoreColor(dashboard?.interview_score)}
            />
            <KpiCard
              icon={Award}
              title="Placement Readiness"
              value={
                dashboard?.placement_readiness !== null &&
                dashboard?.placement_readiness !== undefined
                  ? `${dashboard.placement_readiness}`
                  : null
              }
              sub="out of 100"
              valueClass={
                dashboard?.placement_readiness >= 80
                  ? "text-emerald-400"
                  : dashboard?.placement_readiness >= 60
                  ? "text-amber-400"
                  : dashboard?.placement_readiness !== null &&
                    dashboard?.placement_readiness !== undefined
                  ? "text-red-400"
                  : "text-white"
              }
            />
          </div>
        </div>

        {/* ── Chart + Recent Interviews ────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Performance Chart */}
          <div className="lg:col-span-3 bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">
                  Interview Performance
                </p>
                <p className="text-xs text-zinc-600 mt-0.5">
                  Average score per session
                </p>
              </div>
              <TrendingUp className="w-4 h-4 text-zinc-600" strokeWidth={1.5} />
            </div>

            {loadingHistory ? (
              <div className="flex-1 flex items-center justify-center py-10">
                <svg className="w-4 h-4 animate-spin text-zinc-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              </div>
            ) : showChart ? (
              <SparkChart data={chartData} />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-12 gap-2">
                <p className="text-sm text-zinc-500 font-medium">
                  Not enough data yet
                </p>
                <p className="text-xs text-zinc-600 text-center">
                  Complete at least 2 interviews to see your performance trend.
                </p>
              </div>
            )}
          </div>

          {/* Recent Interviews */}
          <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">
                Recent Interviews
              </p>
              {history.length > 0 && (
                <button
                  onClick={() => navigate("/history")}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors duration-150"
                >
                  View all
                </button>
              )}
            </div>

            {loadingHistory ? (
              <div className="flex-1 flex items-center justify-center py-6">
                <svg className="w-4 h-4 animate-spin text-zinc-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              </div>
            ) : recentHistory.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-10 gap-2">
                <p className="text-sm text-zinc-500 font-medium">No interviews yet</p>
                <p className="text-xs text-zinc-600 text-center">
                  Start your first interview to see results here.
                </p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-zinc-800">
                {recentHistory.map((item) => (
                  <div
                    key={item.session_id}
                    onClick={() => navigate(`/interview-summary/${item.session_id}`)}
                    className="flex items-center justify-between gap-4 py-3.5 cursor-pointer hover:opacity-80 transition-opacity duration-150 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {item.target_role || "Interview"}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {formatDate(item.created_at)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={`text-base font-bold ${scoreColor(item.average_score)}`}>
                        {item.average_score}
                        <span className="text-xs text-zinc-600 font-normal">/10</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Start an Interview ───────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          <p className="text-xs text-zinc-600 uppercase tracking-widest font-semibold">
            Start an Interview
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <InterviewTypeCard
              icon={FileText}
              title="Text Interview"
              description="Practice technical and behavioral questions through text at your own pace."
              onClick={() => navigate("/interview")}
            />
            <InterviewTypeCard
              icon={Mic}
              title="Voice Interview"
              description="Practice answering interview questions naturally using your voice."
              onClick={() => navigate("/voice-interview")}
            />
            <InterviewTypeCard
              icon={Video}
              title="Video Interview"
              description="Practice a realistic interview using your camera and microphone."
              onClick={() => navigate("/video-interview")}
            />
          </div>
        </div>

      </div>
    </div>
  );
}