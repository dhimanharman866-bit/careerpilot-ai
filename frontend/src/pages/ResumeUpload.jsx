import { useState } from "react";
import { FiUploadCloud } from "react-icons/fi";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

const ResumeUpload = () => {
  const [file, setFile] = useState(null);
  const navigate = useNavigate();

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a PDF first.");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    const token = localStorage.getItem("token");
    try {
      const response = await api.post("/resume/upload", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(response.data);
      const resumeId = response.data.resume_id;
      await api.post(`/resume/analyze/${resumeId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate("/resume-analysis");
    } catch (error) {
      console.log(error);
      alert("Upload Failed");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-10 flex flex-col gap-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Resume Upload
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Upload your latest resume and receive AI-powered analysis.
          </p>
        </div>

        {/* Upload card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-6 flex flex-col gap-5">

          {/* Drop zone */}
          <label
            htmlFor="resume"
            className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 rounded-xl h-60 cursor-pointer hover:border-zinc-500 transition-colors duration-150 group"
          >
            <FiUploadCloud
              size={40}
              className="text-zinc-600 group-hover:text-zinc-400 transition-colors duration-150 mb-4"
            />
            <p className="text-sm font-medium text-zinc-300">
              Drag &amp; drop your resume
            </p>
            <p className="text-xs text-zinc-600 mt-1">or click to browse — PDF only</p>
            <input
              id="resume"
              type="file"
              accept=".pdf"
              hidden
              onChange={(e) => setFile(e.target.files[0])}
            />
          </label>

          {/* Selected file */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="text-zinc-600 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">Selected File</p>
              <p className="text-sm text-zinc-300 truncate mt-0.5">
                {file ? file.name : "No file selected"}
              </p>
            </div>
          </div>

          {/* Upload button */}
          <button
            className="w-full py-3.5 rounded-xl bg-white text-zinc-900 font-semibold text-sm hover:bg-zinc-100 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={handleUpload}
            disabled={!file}
          >
            Upload &amp; Analyse Resume
          </button>

        </div>

      </div>
    </div>
  );
};

export default ResumeUpload;