
import express from "express";
import cors from "cors";
import userRoutes from "./routes/usersRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import portfolioRoute from "./routes/portfolioRoute.js";
import jobsRoutes from "./routes/jobsRoutes.js"; 
import searchRoutes from "./routes/searchRoutes.js";

import adminRoute from "./routes/adminRoute.js"
import cookieParser from "cookie-parser";
import { protect } from "./middlewares/AuthMiddleware.js";
import { FRONTEND_URL } from "./config/env.js";



const app = express();

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors({
    origin: FRONTEND_URL,
    credentials: true
}));
app.use(cookieParser());

app.get('/api/protected', protect, (req, res) => {
    res.json({ message: 'Protected content', userId: req.user.id });
});
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/saved-jobs", userRoutes);
app.use("/api/portfolios", portfolioRoute);
app.use("/api/job_postings", jobsRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/admin", adminRoute);

// Root route
app.get("/", (_, res) => {
    res.json("Hello from backend!!!!!!!!!");
});



// Error handling middleware
app.use((err, _, res, __) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
});

// Start the server

app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});

export default app;