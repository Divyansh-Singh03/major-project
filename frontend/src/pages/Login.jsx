import React, { useState } from "react";
import axios from "axios";
import { setAuthToken } from "../api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:4000/api/auth/login",
        { email, password }
      );

      const token = res.data.token;

      if (!token) {
        setError("Login failed");
        return;
      }

      setAuthToken(token);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Invalid email or password");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] to-[#1e293b] font-sans">
      
      <div className="w-[380px] p-8 rounded-2xl bg-[#1e293b]/80 backdrop-blur-lg border border-slate-600 shadow-2xl">

        <h2 className="text-3xl font-bold text-center text-blue-400 mb-6">
          Welcome Back
        </h2>

        <form onSubmit={handleSubmit}>

          <div className="mb-4">
            <label className="block text-slate-300 mb-1">Email</label>
            <input
              type="email"
              className="w-full bg-[#0f172a] border border-slate-600 text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-slate-300 mb-1">Password</label>
            <input
              type="password"
              className="w-full bg-[#0f172a] border border-slate-600 text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm mb-3">{error}</p>
          )}

          <button
            className="w-full bg-blue-500 hover:bg-blue-600 transition-all text-white py-2 rounded-lg font-semibold shadow-lg"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-sm text-center text-slate-400 mt-5">
          Don't have an account?{" "}
          <span
            onClick={() => navigate("/signup")}
            className="text-blue-400 cursor-pointer hover:underline"
          >
            Sign up
          </span>
        </p>
      </div>
    </div>
  );
}