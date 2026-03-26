import express from 'express';
import {
  getSavedJobs,
  saveJob,
  unsaveJob
} from '../controllers/userController.js';

const router = express.Router();


// Get all saved jobs for a user (expects ?userId=xx in query)
router.get("/", getSavedJobs);

// Save a job (expects { userId } in body)
router.post("/:jobId", saveJob);

// Unsave a job (expects { userId } in body)
router.delete("/:jobId", unsaveJob);

export default router;
