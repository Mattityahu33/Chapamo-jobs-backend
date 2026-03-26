// controllers/authController.js
import db from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/env.js";

// REGISTER
export const register = async (req, res) => {
  if (!req.body.username || !req.body.email || !req.body.password) {
    return res.status(400).json({ error: "Username, email, and password are required" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(req.body.email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  if (req.body.password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  try {
    const [existingUsers] = await db.promise().query(
      "SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1",
      [req.body.email, req.body.username]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 12);
    const [result] = await db.promise().query(
      "INSERT INTO users (username, email, password, created_at) VALUES (?, ?, ?, NOW())",
      [req.body.username, req.body.email, hashedPassword]
    );

    return res.status(201).json({
      success: true,
      message: "User registered",
      userId: result.insertId,
    });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ error: "Server error during registration" });
  }
};

// LOGIN
export const login = async (req, res) => {
  const q = "SELECT * FROM users WHERE username = ?";
  db.query(q, [req.body.username], async (err, data) => {
    if (err) return res.status(500).json(err);
    if (data.length === 0) return res.status(404).json("User not found!");

    const user = data[0];

    if (user.status === "suspended") {
      return res.status(403).json("Your account is suspended. Please contact admin.");
    }

    const isPasswordCorrect = await bcrypt.compare(req.body.password, user.password);
    if (!isPasswordCorrect) return res.status(400).json("Wrong credentials");

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const { password, ...userData } = user;

    res
      .cookie("accessToken", token, {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production", // only secure in prod
      })
      .status(200)
      .json(userData);
  });
};

// LOGOUT
export const logout = (req, res) => {
  res.clearCookie("accessToken", {
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });
  res.status(200).json("User logged out");
};

// GET USER
export const getUser = (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not authenticated");

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(403).json("Token invalid");

    try {
      const [rows] = await db
        .promise()
        .query("SELECT id, username, email, role FROM users WHERE id = ?", [
          decoded.id,
        ]);

      if (rows.length === 0) return res.status(404).json("User not found");

      return res.status(200).json(rows[0]);
    } catch (error) {
      console.error("Database error:", error);
      return res.status(500).json("Internal server error");
    }
  });
};

// VALIDATE TOKEN
export const validateToken = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Token invalid or expired" });
  }
  res.status(200).json({ message: "Token is valid" });
};
