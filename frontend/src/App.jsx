import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import DashboardLayout from "./Layouts/DashboardLayout";
import ResumeUpload from "./pages/ResumeUpload";
import ResumeAnalysis from "./pages/ResumeAnalysis";
import InterviewSetup from "./pages/InterviewSetup";
import Interview from "./pages/Interview";
function App() {
  return (
    <BrowserRouter>
      <Routes>
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
          
      </Routes>
    </BrowserRouter>
  );
};

export default App;