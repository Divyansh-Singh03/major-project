import React, { useState } from "react";
import axios from "axios";
import { setAuthToken } from "../api";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:4000/api/auth/register", { name, email, password });
      const token = res.data.token;
      if (!token) { setError("Signup failed"); return; }
      setAuthToken(token);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Registration failed. Please try again.");
    }
    setLoading(false);
  }

  const inputStyle = {
    width: "100%", background: "#0b1120", border: "1px solid #1e2d4a",
    borderRadius: 10, padding: "12px 16px", color: "#f1f5f9", fontSize: 14,
    outline: "none", boxSizing: "border-box", transition: "border-color 0.2s",
    fontFamily: "inherit",
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#0e1623", fontFamily: "'DM Sans','Segoe UI',sans-serif", position: "relative", overflow: "hidden"
    }}>
      <div style={{ position: "absolute", top: "10%", right: "20%", width: 300, height: 300, background: "#6366f10d", borderRadius: "50%", filter: "blur(80px)" }} />
      <div style={{ position: "absolute", bottom: "20%", left: "15%", width: 250, height: 250, background: "#22c55e0d", borderRadius: "50%", filter: "blur(80px)" }} />

      <div style={{
        width: 400, background: "#0b1120", border: "1px solid #1a2540",
        borderRadius: 20, padding: "40px 36px", boxShadow: "0 24px 64px #00000066",
        position: "relative", zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
          <div style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", borderRadius: 10, padding: "8px 10px", boxShadow: "0 4px 14px #22c55e44" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
          </div>
          <span style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9", letterSpacing: -0.3 }}>StockTracker</span>
        </div>

        <h2 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 800, color: "#f1f5f9", letterSpacing: -0.4 }}>Create account</h2>
        <p style={{ margin: "0 0 28px", fontSize: 13, color: "#475569" }}>Start tracking your portfolio today</p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 7, textTransform: "uppercase", letterSpacing: 0.5 }}>Full Name</label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)} required
              placeholder="John Doe"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = "#22c55e"}
              onBlur={e => e.target.style.borderColor = "#1e2d4a"}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 7, textTransform: "uppercase", letterSpacing: 0.5 }}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="you@example.com"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = "#22c55e"}
              onBlur={e => e.target.style.borderColor = "#1e2d4a"}
            />
          </div>

          <div style={{ marginBottom: 22 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 7, textTransform: "uppercase", letterSpacing: 0.5 }}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="Min. 8 characters"
                style={{ ...inputStyle, paddingRight: 44 }}
                onFocus={e => e.target.style.borderColor = "#22c55e"}
                onBlur={e => e.target.style.borderColor = "#1e2d4a"}
              />
              <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#475569", padding: 0 }}>
                {showPass
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: "#f8717118", border: "1px solid #f8717133", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#f87171", marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              width: "100%", background: loading ? "#14532d" : "linear-gradient(135deg,#22c55e,#16a34a)",
              border: "none", borderRadius: 10, padding: "13px", color: "white",
              fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s", boxShadow: loading ? "none" : "0 4px 14px #22c55e44",
              fontFamily: "inherit",
            }}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p style={{ margin: "22px 0 0", fontSize: 13, textAlign: "center", color: "#475569" }}>
          Already have an account?{" "}
          <span onClick={() => navigate("/login")} style={{ color: "#22c55e", cursor: "pointer", fontWeight: 600 }}>
            Sign in
          </span>
        </p>
      </div>
    </div>
  );
}
