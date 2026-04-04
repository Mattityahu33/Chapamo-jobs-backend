import sql from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  NODE_ENV
} from "../config/env.js";

/**
 * =========================
 * REGISTER USER
 * =========================
 */
export const register = async (req, res, next) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields"
    });
  }

  try {
    const existing = await sql`
      SELECT id FROM users
      WHERE email = ${email} OR username = ${username}
      LIMIT 1
    `;

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await sql`
      INSERT INTO users (username, email, password)
      VALUES (${username}, ${email}, ${hashedPassword})
      RETURNING id
    `;

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: { userId: result[0].id }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * =========================
 * LOGIN USER
 * =========================
 */
export const login = async (req, res, next) => {
  const { username, password } = req.body;

  try {
    const result = await sql`
      SELECT * FROM users WHERE username = ${username} LIMIT 1
    `;

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const user = result[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // IMPORTANT: Ensure JWT_EXPIRES_IN is valid
    if (!JWT_EXPIRES_IN) {
      throw new Error("JWT_EXPIRES_IN is missing in environment variables");
    }

    const token = jwt.sign(
      { id: user.id, role: user.role }, // 🔥 add role
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const { password: _, ...safeUser } = user;

    return res
      .cookie("accessToken", token, {
        httpOnly: true,
        secure: NODE_ENV === "production",
        sameSite: NODE_ENV === "production" ? "none" : "lax",
        maxAge: parseExpiryToMs(JWT_EXPIRES_IN)
      })
      .status(200)
      .json({
        success: true,
        message: "Login successful",
        data: safeUser
      });

  } catch (err) {
    next(err);
  }
};

/**
 * =========================
 * GET CURRENT USER
 * =========================
 */
export const getUser = async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated"
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await sql`
      SELECT id, username, email, role
      FROM users
      WHERE id = ${decoded.id}
      LIMIT 1
    `;

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: user[0]
    });

  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "JWT expired"
      });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token"
      });
    }

    next(err);
  }
};

/**
 * =========================
 * LOGOUT
 * =========================
 */
export const logout = (req, res) => {
  return res
    .clearCookie("accessToken", {
      httpOnly: true,
      secure: NODE_ENV === "production",
      sameSite: NODE_ENV === "production" ? "none" : "lax"
    })
    .status(200)
    .json({
      success: true,
      message: "Logged out successfully"
    });
};

/**
 * =========================
 * TOKEN VALIDATION
 * =========================
 */
export const validateToken = (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Token invalid or expired"
    });
  }

  return res.status(200).json({
    success: true,
    message: "Token valid"
  });
};

/**
 * =========================
 * HELPER: convert JWT expiry → cookie maxAge
 * =========================
 */
function parseExpiryToMs(exp) {
  if (!exp) return 24 * 60 * 60 * 1000;

  const match = exp.match(/(\d+)([dhms])/);

  if (!match) return 24 * 60 * 60 * 1000;

  const value = parseInt(match[1]);
  const unit = match[2];

  const map = {
    d: 24 * 60 * 60 * 1000,
    h: 60 * 60 * 1000,
    m: 60 * 1000,
    s: 1000
  };

  return value * (map[unit] || map.d);
}