import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";

const Interview = () => {

    const { sessionId } = useParams();

    const [interview, setInterview] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);

    const fetchInterview = async () => {

        const token = localStorage.getItem("token");

        try {

            const response = await api.get(
                `/interview/session/${sessionId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setInterview(response.data);

        } catch (error) {

            console.log(error);
            alert("Failed to load interview.");

        }

    };

    useEffect(() => {
        fetchInterview();
    }, []);

    if (!interview) {
        return (
            <div className="text-white text-2xl">
                Loading Interview...
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto py-10">

            {/* Header */}

            <h1 className="text-4xl font-bold text-white">
                {interview.target_role} Interview
            </h1>

            <p className="text-zinc-400 mt-2">
                AI-generated interview based on your resume.
            </p>

            {/* Progress */}

            <div className="mt-8 flex items-center justify-between">

                <h2 className="text-xl text-white font-semibold">
                    Question {currentQuestion + 1} of {interview.questions.length}
                </h2>

                <span className="text-purple-400 font-medium">
                    {interview.questions[currentQuestion].difficulty}
                </span>

            </div>

            {/* Question Card */}

            <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-8">

                <p className="text-2xl text-white leading-relaxed">
                    {interview.questions[currentQuestion].question}
                </p>

            </div>

            {/* Answer */}

            <div className="mt-8">

                <label className="block text-white font-medium mb-3">
                    Your Answer
                </label>

                <textarea
                    rows="8"
                    placeholder="Type your answer here..."
                    className="
                        w-full
                        bg-zinc-900
                        border
                        border-zinc-800
                        rounded-xl
                        p-5
                        text-white
                        placeholder:text-zinc-500
                        focus:outline-none
                        focus:border-purple-500
                    "
                />

            </div>

            {/* Submit */}

            <button
                className="
                    mt-8
                    w-full
                    py-4
                    rounded-xl
                    bg-gradient-to-r
                    from-purple-600
                    to-fuchsia-600
                    text-white
                    font-semibold
                    hover:opacity-90
                    transition
                "
            >
                Submit Answer
            </button>

        </div>
    );
};

export default Interview;