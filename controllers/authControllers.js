// controllers/authController.js
import sql from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;

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
    const existingUsers = await sql`
      SELECT id FROM users WHERE email = ${req.body.email} OR username = ${req.body.username} LIMIT 1
    `;

    if (existingUsers.length > 0) {
      return res.status(409).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 12);
    const result = await sql`
      INSERT INTO users (username, email, password)
      VALUES (${req.body.username}, ${req.body.email}, ${hashedPassword})
      RETURNING id
    `;

    console.log("[register] New user id:", result[0].id);

    return res.status(201).json({
      success: true,
      message: "User registered",
      userId: result[0].id,
    });
  } catch (err) {
    console.error("[register] SQL error:", err);
    return res.status(500).json({ error: "Server error during registration" });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const data = await sql`SELECT * FROM users WHERE username = ${req.body.username}`;
    console.log("[login] Query result:", data);

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
        sameSite: "lax",           // "strict" blocks cross-origin cookies in dev
        secure: false,             // must be false for http://localhost
      })
      .status(200)
      .json(userData);
  } catch (err) {
    console.error("[login] SQL error:", err);
    return res.status(500).json({ error: "Server error during login" });
  }
};

// LOGOUT
export const logout = (req, res) => {
  res.clearCookie("accessToken", {
    sameSite: "lax",
    secure: false,
    httpOnly: true,
  });
  res.status(200).json("User logged out");
};

// GET USER  (/auth/me)
export const getUser = (req, res) => {
  // Accept token from cookie OR Authorization header
  const cookieToken = req.cookies?.accessToken;
  const headerToken = req.headers?.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.split(" ")[1]
    : null;

  const token = cookieToken || headerToken;

  console.log("[getUser] cookie token present:", !!cookieToken, "| header token present:", !!headerToken);

  if (!token) return res.status(401).json("Not authenticated");

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      console.error("[getUser] JWT verify error:", err.message);
      return res.status(401).json("Token invalid");
    }

    try {
      const rows = await sql`
        SELECT id, username, email, role FROM users WHERE id = ${decoded.id}
      `;

      console.log("[getUser] rows found:", rows.length);

      if (rows.length === 0) return res.status(404).json("User not found");

      return res.status(200).json(rows[0]);
    } catch (error) {
      console.error("[getUser] Database error:", error);
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
