import express from "express";
import {
  getAllPortfolios,
  createPortfolio,
  getPortfolioByUserId,
  getPortfolioById,   
// or getUserPortfolio if tied to a user
  updatePortfolio,
  deletePortfolio
} from "../controllers/portfolioControllers.js";
const router = express.Router();

// GET all portfolios
router.get("/", getAllPortfolios);

// GET portfolio by user ID (MUST come before /:id to avoid conflict)
router.get('/user/me', getPortfolioByUserId); 

// GET single portfolio by portfolio ID
router.get("/:id", getPortfolioById); 


// POST (create) new portfolio
router.post("/", createPortfolio);

// PUT (update) portfolio
router.put("/:id", updatePortfolio);

// DELETE portfolio
router.delete("/:id", deletePortfolio);

export default router;