import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ToastProvider from "./ToastProvider";
import { toast } from "react-toastify";
import Navbar from "./Navbar";
import "../styles/App.css";

export default function Profile({ user, setUser }) {
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    dob: "",
    country: "",
    postal_address: "",
    current_address: "",
    permanent_address: "",
    religion: "",
    gender: "",
    phone_number: "",
    phone_number_alt: "",
    email: "",
    marital_status: "",
    nationality: "",
    city: "",
    state: "",
    languages: "",
    emergency_contact: "",
    blood_group: "",
  });

  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/signin");
      return;
    }

    // Fetch existing profile
    fetch("http://localhost:5000/api/auth/me", {
      method: "GET",
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.user_profiles) {
          setProfile((prev) => ({ ...prev, ...data.user_profiles }));
        }
      })
      .catch((err) => console.error(err));
  }, [user, navigate]);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  // Automatically check if any field in the profile is empty
  const emptyField = Object.entries(profile).find(
    ([_, value]) => !value?.toString().trim()
  );

  if (emptyField) {
    const [fieldName] = emptyField;
    toast.error(`Please fill the Empty field.`);
    return;
  }

  const userId = user.user_id || user.id;

  // ...continue with the rest of your submit logic
 // fallback to id if user_id not available

    if (!user || !userId) {
      setMessage("User not found. Please log in again.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ user_id: userId, ...profile }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Server error");
      } else {
        toast.success(data.message || "Profile saved successfully!");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Server error");
    }
  };

  if (!user) return null;

  const fields = [
    { name: "first_name", type: "text", placeholder: "First Name" },
    { name: "last_name", type: "text", placeholder: "Last Name" },
    { name: "dob", type: "date", placeholder: "Date of Birth" },
    { name: "country", type: "text", placeholder: "Country" },
    { name: "postal_address", type: "text", placeholder: "Postal Address" },
    { name: "current_address", type: "text", placeholder: "Current Address" },
    {
      name: "permanent_address",
      type: "text",
      placeholder: "Permanent Address",
    },
    { name: "religion", type: "text", placeholder: "Religion" },
    {
      name: "gender",
      type: "select",
      placeholder: "Select Gender",
      options: ["Male", "Female", "Other"],
    },
    { name: "phone_number", type: "text", placeholder: "Phone Number" },
    {
      name: "phone_number_alt",
      type: "text",
      placeholder: "Alternate Phone Number",
    },
    { name: "email", type: "email", placeholder: "Email" },
    {
      name: "marital_status",
      type: "select",
      placeholder: "Select Marital Status",
      options: ["Single", "Married", "Divorced", "Widowed"],
    },
    { name: "nationality", type: "text", placeholder: "Nationality" },
    { name: "city", type: "text", placeholder: "City" },
    { name: "state", type: "text", placeholder: "State" },
    {
      name: "languages",
      type: "text",
      placeholder: "Languages (comma separated)",
    },
    {
      name: "emergency_contact",
      type: "text",
      placeholder: "Emergency Contact",
    },
    {
      name: "blood_group",
      type: "select",
      placeholder: "Select Blood Group",
      options: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
    },
  ];

  return (
    <>
      <Navbar setUser={setUser} />
      <form onSubmit={handleSubmit}>
        <h2>User Profile</h2>
        {message && <div className="message-box">{message}</div>}

        <div className="form-row">
          {fields.map((field) => (
            <div key={field.name} className="form-group">
              {field.type === "select" ? (
                <select
                  name={field.name}
                  value={profile[field.name] || ""}
                  onChange={handleChange}
                >
                  <option value="">{field.placeholder}</option>
                  {field.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  name={field.name}
                  type={field.type}
                  value={profile[field.name] || ""}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                />
              )}
            </div>
          ))}
        </div>

        <button type="submit">Save Profile</button>
      </form>


      <ToastProvider />

    </>
  );
}
