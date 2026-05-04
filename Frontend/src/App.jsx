import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import SignIn from "./components/SignIn";
import SignUp from "./components/SignUp";
import Profile from "./components/Profile";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import { apiUrl } from "./lib/api";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check session on first load (refresh, new tab)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(apiUrl("/api/auth/me"), {
          method: "GET",
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user || null);
        } else {
          setUser(null);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <Router>
      <Routes>
        {/* Default redirect */}
        <Route
          path="/"
          element={user ? <Navigate to="/profile" /> : <Navigate to="/signin" replace />}
        />

        {/* Auth Routes */}
        <Route
          path="/signin"
          element={user ? <Navigate to="/profile" /> : <SignIn setUser={setUser} />}
        />
        <Route
          path="/signup"
          element={user ? <Navigate to="/profile" /> : <SignUp />}
        />

        {/* Forgot / Reset Password */}
        <Route 
          path="/forgot" 
          element={user ? <Navigate to="/profile" /> : <ForgotPassword />} />
        <Route
         path="/reset"
         element={user ? <Navigate to="profile" /> : <ResetPassword />} />

        {/* Protected Profile Route */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute user={user}>
              <Profile user={user} setUser={setUser} />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
