import { PORT, FRONTEND_URL } from "./config/env.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import userRoutes from "./routes/usersRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import portfolioRoute from "./routes/portfolioRoute.js";
import jobsRoutes from "./routes/jobsRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import adminRoute from "./routes/adminRoute.js";

import { protect } from "./middlewares/AuthMiddleware.js";

const app = express();

/* =========================
   GLOBAL MIDDLEWARE
========================= */

// Security headers
app.use(helmet());

// Parse JSON
app.use(express.json());

// Parse cookies
app.use(cookieParser());

/* =========================
   CORS CONFIGURATION
========================= */

const allowedOrigins = [
  "http://localhost:5173",
  FRONTEND_URL
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow tools like Postman or mobile apps
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn("Blocked by CORS:", origin);
      return callback(new Error("CORS not allowed"));
    },
    credentials: true
  })
);

/* =========================
   ROUTES
========================= */

// Health check / root
app.get("/", (_, res) => {
  res.json({ message: "Backend is running 🚀" });
});

// Protected test route
app.get("/api/protected", protect, (req, res) => {
  res.json({
    message: "Protected content",
    userId: req.user.id
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/saved-jobs", userRoutes);
app.use("/api/portfolios", portfolioRoute);
app.use("/api/job_postings", jobsRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/admin", adminRoute);

/* =========================
   404 HANDLER
========================= */

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found"
  });
});

/* =========================
   GLOBAL ERROR HANDLER
========================= */

app.use((err, req, res, next) => {
  console.error("ERROR:", err.message);

  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error"
  });
});

/* =========================
   SERVER START
========================= */

const port = PORT || 5000;

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});

export default app;