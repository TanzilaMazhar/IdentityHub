import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState({ text: "", error: false });
  const navigate = useNavigate();

  const handleForgot = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("https://identityhub-2.onrender.com/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ text: data.message || "Reset link sent!", error: false });
      } else {
        setMessage({ text: data.error || "Error sending reset link", error: true });
      }

      setTimeout(() => setMessage({ text: "", error: false }), 3000);
    } catch (err) {
      setMessage({ text: "Error connecting to server", error: true });
      setTimeout(() => setMessage({ text: "", error: false }), 3000);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Forgot password</h1>
        <p className="auth-subtitle">Enter your email to reset your password</p>

        <form onSubmit={handleForgot}>
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

          <button type="submit" className="auth-button">
            Send reset link
          </button>
        </form>

        <div className="auth-footer">
          Remember your password?{" "}
          <button className="auth-link" onClick={() => navigate("/signin")}>
            Sign in
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

export default ForgotPassword;
