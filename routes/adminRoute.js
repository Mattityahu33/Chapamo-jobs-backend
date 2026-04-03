import express from "express";
import { getAllUsers, updateUserStatus, getPendingJobs, approveJob, rejectJob } from "../controllers/adminControllers.js";
import { verifyAdmin } from "../controllers/adminControllers.js";
import { protect } from "../middlewares/AuthMiddleware.js";

const router = express.Router();

/**
 * All admin routes require authentication and admin role
 */
router.use(protect);
router.use(verifyAdmin);

// Get all pending jobs
router.get("/pending", getPendingJobs);

// Approve a job
router.put("/:id/approve", approveJob);

// Reject a job
router.put("/:id/reject", rejectJob);

// Get all users 
router.get("/users", getAllUsers);

// Update user status
router.put("/users/:id/status", updateUserStatus);

export default router;
