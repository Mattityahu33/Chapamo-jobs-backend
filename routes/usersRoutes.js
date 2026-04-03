import express from 'express';
import {
  getSavedJobs,
  saveJob,
  unsaveJob
} from '../controllers/userController.js';
import { protect } from '../middlewares/AuthMiddleware.js';

const router = express.Router();

// All saved-jobs routes require authentication
router.use(protect);

// Get all saved jobs for a user (expects ?userId=xx in query)
router.get("/", getSavedJobs);

// Save a job (expects { userId } in body)
router.post("/:jobId", saveJob);

// Unsave a job (expects { userId } in body)
router.delete("/:jobId", unsaveJob);

export default router;
