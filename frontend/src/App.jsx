import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import DashboardLayout from "./Layouts/DashboardLayout";
import ResumeUpload from "./pages/ResumeUpload";
import ResumeAnalysis from "./pages/ResumeAnalysis";
import InterviewSetup from "./pages/InterviewSetup";
import Interview from "./pages/Interview";
import InterviewSummary from "./pages/InterviewSummary";
import InterviewHistory from "./pages/InterviewHistory";
import PlacementReadiness from "./pages/PlacementReadiness";
import VoiceInterviewTest from "./pages/VoiceInterview";
import VideoInterview from "./pages/VideoInterview";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/dashboard"
          element={<DashboardLayout>
            <Dashboard />
          </DashboardLayout>}
        />
        <Route 
          path="/resume-upload"
          element={
            <DashboardLayout>
            <ResumeUpload />
            </DashboardLayout>
          } 
        />
        <Route 
          path="/resume-analysis" 
          element={<DashboardLayout><ResumeAnalysis /></DashboardLayout>} 
        />
        <Route
          path="/interview"
          element={
              <DashboardLayout>
                  <InterviewSetup />
              </DashboardLayout>
          }
        />
        <Route
          path="/interview/:sessionId"
          element={
            <DashboardLayout>
              <Interview />
            </DashboardLayout>
          }
        />
        <Route
        path="/interview-summary/:sessionId"
        element={<DashboardLayout>
          <InterviewSummary />
        </DashboardLayout>}
        />
        <Route
        path="/history"
        element={<DashboardLayout>
          <InterviewHistory />
        </DashboardLayout>}
        />
        <Route
        path="/placement"
        element={<DashboardLayout>
          <PlacementReadiness />
        </DashboardLayout>}
        />
        <Route
        path="/voice-interview"
        element={<DashboardLayout><VoiceInterviewTest /></DashboardLayout>}
        />
        <Route
        path="/video-interview"
        element={<DashboardLayout><VideoInterview /></DashboardLayout>}
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;