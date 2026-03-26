import express from "express";

import {getAllUsers, updateUserStatus, getPendingJobs, approveJob, rejectJob } from "../controllers/adminControllers.js";


import { verifyAdmin } from "../controllers/adminControllers.js";

const router = express.Router();

//ADMIN ROUTES 



// Admin only: get all pending jobs
router.get("/pending", getPendingJobs);

// Admin only: approve a job
router.put("/:id/approve",  approveJob);

// Admin only: reject a job
router.put("/:id/reject",  rejectJob);

// get all users 

router.get("/users", getAllUsers);

// update users status
router.put("/users/:id/status", updateUserStatus);

export default router;
