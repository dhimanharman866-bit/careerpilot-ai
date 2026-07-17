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

            const response = await api.get(
                "/resume/latest-analysis",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

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

            <div className="text-white text-2xl">

                Loading Resume Analysis...

            </div>

        );

    }

    return (

        <div className="max-w-7xl mx-auto pb-10">

            <h1 className="text-4xl font-bold text-white">

                Resume Analysis

            </h1>

            <p className="text-zinc-400 mt-2">

                AI-powered analysis of your latest resume.

            </p>

            {/* SCORE */}

            <div className="mt-10 rounded-3xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 p-10 text-center shadow-xl">

                <h2 className="text-white text-xl font-semibold">

                    Resume Score

                </h2>

                <h1 className="text-7xl font-bold text-white mt-3">

                    {analysis.score}

                    <span className="text-3xl">/100</span>

                </h1>

                <p className="text-purple-100 mt-4">

                    Excellent Resume ⭐

                </p>

            </div>

            {/* GRID */}

            <div className="grid lg:grid-cols-2 gap-8 mt-10">

                {/* Skills */}

                <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">

                    <h2 className="text-white text-2xl font-semibold mb-6 flex items-center gap-3">

                        <FiCode />

                        Skills

                    </h2>

                    <div className="flex flex-wrap gap-3">

                        {analysis.skills.map((skill,index)=>(

                            <span
                                key={index}
                                className="bg-zinc-800 px-4 py-2 rounded-full text-white"
                            >

                                {skill}

                            </span>

                        ))}

                    </div>

                </div>

                {/* Projects */}

                <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">

                    <h2 className="text-white text-2xl font-semibold mb-6 flex items-center gap-3">

                        <FiFolder />

                        Projects

                    </h2>

                    <div className="space-y-3">

                        {analysis.projects.map((project,index)=>(

                            <div
                                key={index}
                                className="bg-zinc-800 rounded-xl p-4 text-white"
                            >

                                {project}

                            </div>

                        ))}

                    </div>

                </div>

                {/* Strengths */}

                <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">

                    <h2 className="text-green-400 text-2xl font-semibold mb-6 flex items-center gap-3">

                        <FiCheckCircle />

                        Strengths

                    </h2>

                    <div className="space-y-3">

                        {analysis.strengths.map((strength,index)=>(

                            <div
                                key={index}
                                className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-white"
                            >

                                {strength}

                            </div>

                        ))}

                    </div>

                </div>

                {/* Weakness */}

                <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">

                    <h2 className="text-yellow-400 text-2xl font-semibold mb-6 flex items-center gap-3">

                        <FiAlertCircle />

                        Areas to Improve

                    </h2>

                    <div className="space-y-3">

                        {analysis.weaknesses.map((weakness,index)=>(

                            <div
                                key={index}
                                className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-white"
                            >

                                {weakness}

                            </div>

                        ))}

                    </div>

                </div>

            </div>

            {/* AI Suggestions */}

            <div className="mt-10 bg-zinc-900 rounded-2xl border border-zinc-800 p-8">

                <h2 className="text-2xl text-white font-semibold flex items-center gap-3">

                    <FiZap className="text-purple-500"/>

                    AI Suggestions

                </h2>

                <div className="mt-6 space-y-4 text-zinc-300">

                    <p>💡 Add measurable achievements to every project.</p>

                    <p>💡 Add GitHub repository links to projects.</p>

                    <p>💡 Add professional certifications.</p>

                    <p>💡 Improve your resume summary with stronger action verbs.</p>

                </div>

            </div>

        </div>

    );

};

export default ResumeAnalysis;