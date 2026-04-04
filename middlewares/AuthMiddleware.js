import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';

/**
 * Middleware to protect routes that require authentication
 * Purpose: Verifies the accessToken from cookies
 * Inputs: req.cookies.accessToken
 * Output: Sets req.user or returns 401
 */
export const protect = (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Missing authentication token"
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = decoded; // 🔥 include all payload

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token expired or invalid"
    });
  }
};

/**
 * Alias for protect, ensures backward compatibility if used
 */
export const verifyToken = protect;
