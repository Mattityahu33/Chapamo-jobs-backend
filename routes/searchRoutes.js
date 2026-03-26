import express from 'express';
import {  unifiedSearch } from '../controllers/searchController.js';

const router = express.Router();

// Public search route
router.get("/",  unifiedSearch );

export default router;