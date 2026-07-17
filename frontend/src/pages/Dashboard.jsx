import StatCard from "../components/StatCard";
import ActionCard from "../components/ActionCard";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../services/api";
const Dashboard = () => {
  const navigate=useNavigate();
  const [dashboard,setDashboard]=useState(null);
  const fetchDashboard= async ()=>{
    const token=localStorage.getItem('token');
    try {
      const response=await api.get(
        "/dashboard",
        {
          headers:{
            Authorization:`Bearer ${token}`
          }
        }
      );
      setDashboard(response.data);
    } catch (error){
      console.log(error);
    }
  }
  useEffect(()=>{
    fetchDashboard();
  },[]);
  if (!dashboard){
    return (
      <div className="text-white text-2xl">
        Loading Dashboard
      </div>
    )
  }
  return (
    <div>

      <div className="grid grid-cols-3 gap-6">

        <StatCard
          title="Placement Readiness"
          score={dashboard.placement_readiness}
          hasData={dashboard.placement_readiness!==null}
          emptyMessage="Complete resume analysis and interview"
        />

        <StatCard
          title="Resume Score"
          score={dashboard.resume_score}
          hasData={dashboard.has_resume}
          emptyMessage="Upload your resume to recieve AI analysis."
        />

        <StatCard
          title="Interview Score"
          score={dashboard.interview_score}
          hasData={dashboard.has_interview}
          emptyMessage="Start your first AI Interview"
        />

      </div>
      <h2 className="text-white text-2xl font-bold mt-10 mb-6">
        Quick Action 
      </h2>
      <div className="grid grid-cols-3 gap-6">

        <ActionCard
          title="Upload Resume"
          description="Upload your latest resume"
          onClick={()=>navigate("/resume-upload")}
        />

        <ActionCard
          title="Resume Analysis"
          description="Analyze skills and weaknesses"
          onClick={()=>navigate("/resume-analysis")}
        />

        <ActionCard
          title="Start Interview"
          description="Begin AI interview session"
          onClick={()=>navigate("/interview")}
        />

      </div>
    </div>
  );
};

export default Dashboard;