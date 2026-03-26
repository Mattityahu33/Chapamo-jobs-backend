// routes/jobsRoutes.js
import express from 'express';
import {
  getAllJobs,
  getJobById,
  createJob,
  getSimilarJobs,
  applyToJob,
  getApplications,
  getSavedJobs,
  saveJob,
  getCategories
} from '../controllers/jobsControllers.js';

const router = express.Router();

// Job postings
router.get('/', getAllJobs);                  // GET /api/job_postings
router.get('/:id', getJobById);               // GET /api/job_postings/:id
router.post('/', createJob);                  // POST /api/job_postings
router.get('/:id/similar', getSimilarJobs);   // GET /api/job_postings/:id/similar

// Applications
router.post('/:id/apply', applyToJob);        // POST /api/job_postings/:id/apply
router.get('/:id/applications', getApplications); // GET /api/job_postings/:id/applications

// Saved jobs
router.get('/users/:userId/saved-jobs', getSavedJobs);   // GET /api/job_postings/users/:userId/saved-jobs
router.post('/:id/save', saveJob);                       // POST /api/job_postings/:id/save

// Categories
router.get('/job-categories', getCategories);            // GET /api/job_postings/job-categories

export default router;
