import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';

/**
 * Middleware to protect routes that require authentication
 * Purpose: Verifies the accessToken from cookies
 * Inputs: req.cookies.accessToken
 * Output: Sets req.user or returns 401
 */
export const protect = (req, res, next) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Missing authentication token. Please log in.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded?.id) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload.'
      });
    }

    req.user = { id: decoded.id };
    next();
  } catch (error) {
    console.error('🔴 Token verification error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.'
    });
  }
};

/**
 * Alias for protect, ensures backward compatibility if used
 */
export const verifyToken = protect;
