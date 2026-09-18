import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const handleLogin = async () => {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    const response = await api.post("/login", formData);
    console.log(response.data);
    localStorage.setItem("token", response.data.access_token);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            CareerPilot AI
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-8 flex flex-col gap-5">

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
            />
          </div>

          <button
            onClick={handleLogin}
            className="w-full bg-white text-zinc-900 rounded-xl py-3 text-sm font-semibold hover:bg-zinc-100 transition-colors duration-150 mt-1"
          >
            Sign In
          </button>

        </div>

        <p className="text-center text-sm text-zinc-600 mt-6">
          Don't have an account?{" "}
          <a href="/register" className="text-zinc-400 hover:text-white transition-colors">
            Register
          </a>
        </p>

      </div>
    </div>
  );
};

export default Login;