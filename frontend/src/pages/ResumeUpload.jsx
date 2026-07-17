import { useState } from "react";
import { FiUploadCloud } from "react-icons/fi";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

const ResumeUpload = () => {
  const [file, setFile] = useState(null);
  const navigate=useNavigate();
  const handleUpload = async () => {
    if(! file){
        alert("Please select a PDF first.");
        return;
    }
    const formData=new FormData();
    formData.append("file",file);
    const token=localStorage.getItem("token");
    try {
        const response = await api.post(
            "/resume/upload",
            formData,{
                headers:{
                    Authorization: `Bearer ${token}`
                }
            }
        );
        console.log(response.data);
        const resumeId=response.data.resume_id;
        await api.post(`/resume/analyze/${resumeId}`,{},{
            headers:{
                Authorization: `Bearer ${token}`
            }
        }  
    );
    navigate("/resume-analysis");
    } catch(error){
        console.log(error);
        alert("Upload Failed");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">

      <h1 className="text-4xl font-bold text-white">
        Resume Upload
      </h1>

      <p className="text-zinc-400 mt-2">
        Upload your latest resume and receive AI-powered analysis.
      </p>

      <div className="mt-10 bg-zinc-900 border border-zinc-800 rounded-2xl p-10">

        <label
          htmlFor="resume"
          className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 rounded-xl h-80 cursor-pointer hover:border-purple-500 transition-all duration-300"
        >

          <FiUploadCloud
            size={70}
            className="text-purple-500"
          />

          <h2 className="text-white text-2xl font-semibold mt-6">
            Drag & Drop your Resume
          </h2>

          <p className="text-zinc-400 mt-2">
            or click to browse PDF files
          </p>

          <input
            id="resume"
            type="file"
            accept=".pdf"
            hidden
            onChange={(e) => setFile(e.target.files[0])}
          />

        </label>

        <div className="mt-8">

          <p className="text-zinc-400">
            Selected File
          </p>

          <p className="text-white mt-2">
            {file ? file.name : "No file selected"}
          </p>

        </div>

        <button
          className="mt-8 bg-purple-600 hover:bg-purple-700 transition px-8 py-3 rounded-lg text-white font-semibold cursor-pointer" onClick={handleUpload} 
        >
          Upload Resume
        </button>

      </div>

    </div>
  );
};

export default ResumeUpload;