// controllers/authController.js
import sql from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { JWT_SECRET, JWT_EXPIRES_IN, NODE_ENV } from "../config/env.js";

/**
 * Registers a new user
 * Purpose: Hashes password and saves user to database
 * Inputs: req.body { username, email, password }
 * Outputs: JSON response with success status and userId
 */
export const register = async (req, res, next) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: "Username, email, and password are required" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: "Invalid email format" });
  }

  if (password.length < 8) {
    return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
  }

  try {
    const existingUsers = await sql`
      SELECT id FROM users WHERE email = ${email} OR username = ${username} LIMIT 1
    `;

    if (existingUsers.length > 0) {
      return res.status(409).json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await sql`
      INSERT INTO users (username, email, password)
      VALUES (${username}, ${email}, ${hashedPassword})
      RETURNING id
    `;

    console.log("🟢 [Auth] New user registered:", result[0].id);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: { userId: result[0].id },
    });
  } catch (err) {
    next(err); // Pass to global error handler
  }
};

/**
 * Logs in a user
 * Purpose: Validates credentials, generates JWT, and sets secure cookie
 * Inputs: req.body { username, password }
 * Outputs: JSON response with user data and accessToken cookie
 */
export const login = async (req, res, next) => {
  const { username, password } = req.body;

  try {
    const data = await sql`SELECT * FROM users WHERE username = ${username}`;
    
    if (data.length === 0) {
        return res.status(404).json({ success: false, message: "User not found!" });
    }

    const user = data[0];

    if (user.status === "suspended") {
      return res.status(403).json({ success: false, message: "Your account is suspended. Please contact admin." });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
        return res.status(400).json({ success: false, message: "Wrong credentials" });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const { password: _, ...userData } = user;

    console.log("🟢 [Auth] User logged in:", user.id);

    res
      .cookie("accessToken", token, {
        httpOnly: true,
        secure: NODE_ENV === "production", // true in production
        sameSite: "none",                  // Required for cross-origin (Vercel)
        maxAge: 7 * 24 * 60 * 60 * 1000    // 7 days
      })
      .status(200)
      .json({
        success: true,
        message: "Logged in successfully",
        data: userData
      });
  } catch (err) {
    next(err);
  }
};

/**
 * Logs out a user
 * Purpose: Clears the accessToken cookie
 * Inputs: None
 * Outputs: JSON response with success status
 */
export const logout = (req, res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: NODE_ENV === "production",
    sameSite: "none",
  });
  res.status(200).json({ success: true, message: "User logged out successfully" });
};

/**
 * Gets the current authenticated user
 * Purpose: Returns user profile based on JWT in cookie or header
 * Inputs: req.cookies.accessToken or req.headers.authorization
 * Outputs: JSON response with user profile data
 */
export const getUser = async (req, res, next) => {
  // Use req.user set by protect middleware if available, otherwise check tokens
  const token = req.cookies?.accessToken || (req.headers?.authorization?.startsWith("Bearer ") ? req.headers.authorization.split(" ")[1] : null);

  if (!token) return res.status(401).json({ success: false, message: "Not authenticated" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const rows = await sql`
      SELECT id, username, email, role FROM users WHERE id = ${decoded.id}
    `;

    if (rows.length === 0) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
        success: true,
        data: rows[0]
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ success: false, message: "Token invalid" });
    }
    next(error);
  }
};

/**
 * Validates a token
 * Purpose: Checks if the request is authenticated
 * Inputs: req.user (from protect middleware)
 * Outputs: JSON response with validity status
 */
export const validateToken = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Token invalid or expired" });
  }
  res.status(200).json({ success: true, message: "Token is valid" });
};
