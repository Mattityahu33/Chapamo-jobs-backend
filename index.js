import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

import { FRONTEND_URL, PORT } from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/usersRoutes.js";
import portfolioRoute from "./routes/portfolioRoute.js";
import jobsRoutes from "./routes/jobsRoutes.js"; 
import searchRoutes from "./routes/searchRoutes.js";
import adminRoute from "./routes/adminRoute.js"
import { protect } from "./middlewares/AuthMiddleware.js";


const app = express();

// 1. Security Headers (Helmet)
app.use(helmet());

// 2. CORS - Explicit origin and credentials
// ⚠️ REQUIRED: Set this to your Vercel frontend URL in config/env.js
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.LOCAL_FRONTEND_URL
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// 3. Rate Limiting
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: { success: false, message: "Too many requests from this IP, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // stricter limit for auth routes
    message: { success: false, message: "Too many login/register attempts, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use("/api/", globalLimiter);
app.use("/api/auth", authLimiter);

// 4. Body Parsers
app.use(express.json());
app.use(cookieParser());

// 5. Routes
app.use("/api/auth", authRoutes);
app.use("/api/saved-jobs", userRoutes);
app.use("/api/portfolios", portfolioRoute);
app.use("/api/job_postings", jobsRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/admin", adminRoute);

// Root route
app.get("/", (_, res) => {
    res.json({ success: true, message: "Hello from backend!!!!!" });
});

// Protected route example
app.get('/api/protected', protect, (req, res) => {
    res.json({ success: true, message: 'Protected content', userId: req.user.id });
});

// 6. Global Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(`🔴 [Error] ${req.method} ${req.url}:`, err.stack);
    
    const statusCode = err.status || 500;
    const message = err.message || "Internal Server Error";

    res.status(statusCode).json({
        success: false,
        message: message,
        // Only include stack trace in development
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Explicit listener (only used when running index.js directly)
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`🟢 Backend server running on port ${PORT}`);
    });
}

export default app;