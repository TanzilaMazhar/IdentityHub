import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { Pool } from "pg";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import cookieParser from "cookie-parser";
import nodemailer from "nodemailer";

const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT || 5000;

// PostgreSQL connection
const pool = new Pool({
  user: process.env.PG_USER || "postgres",
  host: process.env.PG_HOST || "localhost",
  database: process.env.PG_DATABASE || "jwt_auth_db",
  password: process.env.PG_PASSWORD || "12345678",
  port: Number(process.env.PG_PORT || 5432),
});

//  AUTH

// SIGN UP
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );
    if (existingUser.rows.length > 0)
      return res.status(400).json({ error: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    await pool.query("INSERT INTO users (email, password) VALUES ($1, $2)", [
      email,
      hashed,
    ]);

    return res.json({ message: "User created successfully" });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

// SIGN IN
app.post("/api/auth/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const result = await pool.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);
    if (result.rows.length === 0)
      return res.status(401).json({ error: "Invalid credentials" });

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(401).json({ error: "Invalid credentials" });

    // Generate JWT token
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "1h" });

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.json({
      message: "Signed in successfully",
      user: { id: user.id, email: user.email },
    });
  } catch (err) {
    console.error("Sign in error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// CHECK LOGIN
app.get("/api/auth/me", async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await pool.query(
      `SELECT u.id, u.email,
        up.profile_id, up.first_name, up.last_name, up.dob, up.country,
        up.postal_address, up.current_address, up.permanent_address,
        up.religion, up.gender, up.phone_number, up.phone_number_alt,
        up.email AS profile_email, up.marital_status, up.nationality,
        up.city, up.state, up.languages, up.emergency_contact,
        up.blood_group
      FROM users u
      LEFT JOIN user_profiles up ON up.user_id = u.id
      WHERE u.id = $1`,
      [decoded.id]
    );

    if (!result.rows[0])
      return res.status(404).json({ error: "User not found" });

    const row = result.rows[0];
    const user = { id: row.id, email: row.email };
    const user_profiles = row.profile_id
      ? {
          profile_id: row.profile_id,
          first_name: row.first_name,
          last_name: row.last_name,
          dob: row.dob,
          country: row.country,
          postal_address: row.postal_address,
          current_address: row.current_address,
          permanent_address: row.permanent_address,
          religion: row.religion,
          gender: row.gender,
          phone_number: row.phone_number,
          phone_number_alt: row.phone_number_alt,
          email: row.profile_email,
          marital_status: row.marital_status,
          nationality: row.nationality,
          city: row.city,
          state: row.state,
          languages: row.languages,
          emergency_contact: row.emergency_contact,
          blood_group: row.blood_group,
        }
      : null;

    res.json({ user, user_profiles });
  } catch (err) {
    console.error("Auth check error:", err);
    res.status(401).json({ error: "Invalid token" });
  }
});


// PROFILE
app.post("/api/profile", async (req, res) => {
  try {
    const { user_id, ...fields } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: "user_id is required" });
    }

    const columns = Object.keys(fields);
    const values = Object.values(fields);

    if (columns.length === 0)
      return res.status(400).json({ error: "No fields to update" });

    const insertCols = ["user_id", ...columns].join(", ");
    const insertParams = [user_id, ...values];
    const placeholders = insertParams.map((_, i) => `$${i + 1}`).join(", ");
    const updateSet = columns
      .map((col, idx) => `${col} = $${idx + 2}`)
      .join(", ");

    const sql = `
      INSERT INTO user_profiles (${insertCols})
      VALUES (${placeholders})
      ON CONFLICT (user_id) DO UPDATE
      SET ${updateSet}, updated_at = NOW()
      RETURNING profile_id, user_id, ${columns.join(
        ", "
      )}, created_at, updated_at;
    `;

    const result = await pool.query(sql, insertParams);

    res.json({
      message: "Profile saved successfully!",
      profile: result.rows[0],
    });
  } catch (err) {
    console.error("Profile save error:", err);
    res.status(500).json({ error: "Error saving profile" });
  }
});

//transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Forgot Password
app.post("/api/auth/forgot", async (req, res) => {
  const { email } = req.body;

  if (!email || email.trim() === "") {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Email is not registered" });
    }

    // create JWT with email only
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "15m" }); // short expiry

    const resetLink = `http://localhost:5173/reset?token=${token}`;

    const mailOptions = {
      from: `"Your App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset",
      html: `<p>Click to reset your password:</p><a href="${resetLink}">${resetLink}</a>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);

    res.json({ message: "Reset link sent successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error sending reset email" });
  }
});


// Verify Reset Token
app.post("/api/auth/verify-reset-token", async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, email: decoded.email });
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
});


// Reset Password
app.post("/api/auth/reset", async (req, res) => {
  const { token, password } = req.body;

  if (!token) return res.status(400).json({ error: "Token is required" });
  if (!password || password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { email } = decoded;

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query("UPDATE users SET password=$1 WHERE email=$2", [
      hashedPassword,
      email,
    ]);

    res.json({ message: "Password reset successfully!" });
  } catch (err) {
    console.error(err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
});





// Logout
app.post("/api/auth/logout", (req, res) => {
  // Clear the token cookie
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  res.json({ message: "Logged out successfully" });
});

app.listen(5000, () => console.log("Server running on port 5000"));
