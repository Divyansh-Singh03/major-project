import React, { useState } from "react";
import axios from "axios";
import { setAuthToken } from "../api";

export default function Signup({ onSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:4000/api/auth/register", {
        email,
        password,
      });

      const token = res.data.token;
      setAuthToken(token);

      if (onSignup) onSignup();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Signup failed");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 font-sans">
      <div className="bg-white p-8 shadow-md rounded w-[350px]">
        <h2 className="text-2xl font-semibold mb-6 text-center">Create Account</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-1">Email</label>
            <input
              type="email"
              className="w-full border p-2 rounded"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1">Password</label>
            <input
              type="password"
              className="w-full border p-2 rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

          <button
            className="w-full bg-blue-600 text-white py-2 rounded"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>
      </div>
    </div>
  );
}
