import jwt from 'jsonwebtoken';

export const protect = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Missing token. Access denied.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id) {
      return res.status(403).json({
        success: false,
        error: 'Invalid token payload.'
      });
    }

    req.user = { id: decoded.id };
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired token. Please log in again.'
    });
  }
};


export const verifyToken = (req, res, next) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json({ message: 'Access denied, token missing' });

  jwt.verify(token, "secretkey", (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};


