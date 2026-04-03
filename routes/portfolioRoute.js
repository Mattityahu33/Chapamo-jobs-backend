import express from "express";
import {
  getAllPortfolios,
  createPortfolio,
  getPortfolioByUserId,
  getPortfolioById,   
  updatePortfolio,
  deletePortfolio
} from "../controllers/portfolioControllers.js";
import { protect } from "../middlewares/AuthMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllPortfolios);
router.get("/:id", getPortfolioById); 

// Protected routes (require login)
router.get('/user/me', protect, getPortfolioByUserId); 
router.post("/", protect, createPortfolio);
router.put("/:id", protect, updatePortfolio);
router.delete("/:id", protect, deletePortfolio);

export default router;