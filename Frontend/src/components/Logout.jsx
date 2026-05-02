import React from "react";
import { useNavigate } from "react-router-dom";

export default function Navbar({ setUser }) {
  const navigate = useNavigate();

const handleLogout = async () => {
  try {
    await fetch("https://identityhub-2.onrender.com/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    setUser(null);  // clear React state
  } catch (err) {
    console.error(err);
  }
};



  return (
    <nav>
      <div className="logo">IdentityHub</div>
      <button className="log-out" onClick={handleLogout}>Logout</button>
    </nav>
  );
}
