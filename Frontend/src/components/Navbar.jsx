import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/navbar.css";

export default function Navbar({ setUser }) {
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await fetch("https://identityhub-2.onrender.com/api/auth/logout", {
        method: "POST",
        credentials: "include", // ensures cookie is cleared on server
      });
    } catch (err) {
      console.error("Logout failed:", err);
    }

    // clear frontend user state
    setUser(null);

    // force redirect to signin
    navigate("/signin", { replace: true });
  };

  return (
    <nav className="navbar">
      <div className="logo">IdentityHub</div>
      <ul className="nav-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/profile">Profile</Link></li>
        <li><Link to="/about">About</Link></li>
        <li><Link to="/contact">Contact</Link></li>
        <li>
          <button onClick={handleLogout}>Logout</button>
        </li>
      </ul>
    </nav>
  );
}
