import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";
import { apiUrl } from "../lib/api";

function SignIn({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState({ text: "", error: false });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl("/api/auth/signin"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ensures cookie is sent/received
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // store only user info (token is already in cookie)
        setUser(data.user);

        setMessage({ text: "Signed in successfully!", error: false });

        // redirect to profile page
        navigate("/profile");
      } else {
        setMessage({ text: data.error || "Sign in failed", error: true });
      }
    } catch (err) {
      setMessage({ text: "Server error", error: true });
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Sign in</h1>
        <p className="auth-subtitle">Enter your credentials</p>

        <form onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <label className="auth-label">Email</label>
            <input
              type="email"
              className="auth-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="auth-form-group">
            <div className="auth-row">
              <label className="auth-label">Password</label>
              <button
                type="button"
                className="auth-link forgot"
                onClick={() => navigate("/forgot")}
              >
                Forgot?
              </button>
            </div>
            <input
              type="password"
              className="auth-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-button">
            Sign in
          </button>
        </form>

        <div className="auth-footer">
          Don’t have an account?
          <button className="auth-link" onClick={() => navigate("/signup")}>
            Sign up
          </button>
        </div>

        {message.text && (
          <p className={`auth-message ${message.error ? "error" : "success"}`}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}

export default SignIn;

