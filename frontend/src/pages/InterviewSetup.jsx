import { useState } from "react";
import api from "../services/api";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const InterviewSetup = () => {
    const [targetRole, setTargetRole] = useState("");
    const [adaptive,setAdaptive]=useState(false);
    const navigate=useNavigate();

    const handleStartInterview=async()=>{
        const token=localStorage.getItem('token');
        try{
            const analysisResponse=await api.get("/resume/latest-analysis",{
                headers: {
                    Authorization:`Bearer ${token}`
                }
            });
            const analysisId=analysisResponse.data.analysis_id;
            const interviewResponse=await api.post(
                `/interview/generate-question/${analysisId}`,
                {
                    "target_role":targetRole,
                    "adaptive":adaptive
                },
                {
                    headers: {
                        Authorization:`Bearer ${token}`
                    }
                }
            );
            navigate(`/interview/${interviewResponse.data.session_id}`);
        }
        catch(error){
            console.log(error);
            alert("Unable to start Interview");
        }
    };
    return (
        <div className="max-w-4xl mx-auto py-10">

            {/* Heading */}

            <h1 className="text-4xl font-bold text-white">
                AI Mock Interview
            </h1>

            <p className="text-zinc-400 mt-2">
                Configure your interview before getting started.
            </p>

            {/* Resume Status */}

            <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-xl p-5">

                <h2 className="text-white font-semibold text-lg">
                    Resume Ready ✅
                </h2>

                <p className="text-zinc-400 mt-2">
                    AI will generate personalized interview questions using your
                    uploaded resume, projects, and skills.
                </p>

            </div>

            {/* Setup Card */}

            <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-10">

                {/* Target Role */}

                <div>

                    <label className="block text-white font-medium mb-2">
                        Target Role
                    </label>

                    <input
                        type="text"
                        placeholder="Backend Developer"
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                        className="
                            w-full
                            bg-zinc-800
                            border
                            border-zinc-700
                            rounded-xl
                            px-4
                            py-3
                            text-white
                            placeholder:text-zinc-500
                            focus:outline-none
                            focus:border-purple-500
                        "
                    />

                </div>

                {/* Adaptive */}

                <div className="mt-8">

                    <label className="block text-white font-medium mb-2">
                        Adaptive
                    </label>

                    <select
                        value={adaptive}
                        onChange={(e) => setAdaptive(e.target.value)}
                        className="
                            w-full
                            bg-zinc-800
                            border
                            border-zinc-700
                            rounded-xl
                            px-4
                            py-3
                            text-white
                            focus:outline-none
                            focus:border-purple-500
                        "
                    >
                        <option>Yes</option>
                        <option>No</option>
                    </select>

                </div>

                {/* Interview Type

                <div className="mt-8">

                    <label className="block text-white font-medium mb-2">
                        Interview Type
                    </label>

                    <select
                        value={interviewType}
                        onChange={(e) => setInterviewType(e.target.value)}
                        className="
                            w-full
                            bg-zinc-800
                            border
                            border-zinc-700
                            rounded-xl
                            px-4
                            py-3
                            text-white
                            focus:outline-none
                            focus:border-purple-500
                        "
                    >
                        <option>Technical</option>
                        <option>HR</option>
                        <option>Mixed</option>
                    </select>

                </div> */}

                {/* Start Button */}

                <button
                    className="
                        mt-10
                        w-full
                        py-4
                        rounded-xl
                        font-semibold
                        text-white
                        bg-gradient-to-r
                        from-purple-600
                        to-fuchsia-600
                        hover:opacity-90
                        transition-all
                        duration-300
                    "  onClick={handleStartInterview}
                >
                    Start Interview
                </button>

            </div>

        </div>
    );
};

export default InterviewSetup;