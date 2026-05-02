import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/auth.css";

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState({ text: "", error: false });
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Verify token on mount
  useEffect(() => {
    const tokenFromUrl = new URLSearchParams(location.search).get("token");

    if (!tokenFromUrl) {
      setMessage({ text: "Invalid reset link", error: true });
      // setTimeout(() => navigate("/forgot"), 2000);
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch("https://identityhub-2.onrender.com/api/auth/verify-reset-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: tokenFromUrl }),
        });

        const data = await res.json();
        if (res.ok && data.valid) {
          setToken(tokenFromUrl);
        } else {
          setMessage({ text: data.error || "Invalid or expired token", error: true });
          // setTimeout(() => navigate("/forgot"), 2000);
        }
      } catch (err) {
        setMessage({ text: "Error verifying token", error: true });
        // setTimeout(() => navigate("/forgot"), 2000);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [location, navigate]);

  const handleReset = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage({ text: "Passwords do not match", error: true });
      return;
    }

    try {
      const res = await fetch("https://identityhub-2.onrender.com/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ text: data.message || "Password reset successful!", error: false });
        setTimeout(() => navigate("/signin"), 2000);
      } else {
        setMessage({ text: data.error || "Error resetting password", error: true });
        if (data.error?.includes("Invalid") || data.error?.includes("expired")) {
          // setTimeout(() => navigate("/forgot"), 2000);
        }
      }
    } catch (err) {
      setMessage({ text: "Error connecting to server", error: true });
    }
  };

  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <p className="auth-subtitle">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Reset password</h1>
        <p className="auth-subtitle">Enter your new password</p>

        <form onSubmit={handleReset}>
          <div className="auth-form-group">
            <label className="auth-label">New password</label>
            <input
              type="password"
              className="auth-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="auth-form-group">
            <label className="auth-label">Confirm password</label>
            <input
              type="password"
              className="auth-input"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-button">
            Reset password
          </button>
        </form>

        <div className="auth-footer">
          Back to{" "}
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

export default ResetPassword;
