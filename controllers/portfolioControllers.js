import sql from "../config/db.js";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.js";

/**
 * Fetches all portfolios
 * Purpose: Provides a list of all portfolios for public or admin view
 * Inputs: None
 * Outputs: JSON response with an array of portfolios
 */
export const getAllPortfolios = async (req, res, next) => {
  try {
    const rows = await sql`SELECT * FROM portfolios ORDER BY id DESC`;
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "No portfolios found" });
    }
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
};

/**
 * Creates a new portfolio for the authenticated user
 * Purpose: Allows users to showcase their skills and experience
 * Inputs: req.cookies.accessToken, req.body { full_name, profession_title, ... }
 * Outputs: JSON response with success status
 */
export const createPortfolio = async (req, res, next) => {
  // Authentication check is handled by middleware in the route
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });

  const {
    full_name,
    profession_title,
    phone,
    email,
    location,
    about_me,
    experience_years,
    skills,
    certifications,
    languages,
    availability,
    portfolio_url,
    profile_image_url
  } = req.body;

  if (!full_name || !profession_title || !email || !location || !about_me) {
    return res.status(400).json({ success: false, message: "Missing required fields." });
  }

  try {
    await sql`
      INSERT INTO portfolios (
        user_id, full_name, profession_title, phone, email, location,
        about_me, experience_years, skills, certifications, languages,
        availability, portfolio_url, profile_image_url
      ) VALUES (
        ${userId}, ${full_name}, ${profession_title}, ${phone || null}, ${email}, ${location},
        ${about_me}, ${experience_years ? Number(experience_years) : null}, ${skills || null},
        ${certifications || null}, ${languages || null}, ${availability || "full-time"},
        ${portfolio_url || null}, ${profile_image_url || null}
      )
    `;
    res.status(201).json({ success: true, message: "Portfolio created successfully" });
  } catch (error) {
    next(error);
  }
};

/**
 * Fetches the portfolio of the currently authenticated user
 * Purpose: Allows a user to view their own portfolio
 * Inputs: req.user.id
 * Outputs: JSON response with portfolio details
 */
export const getPortfolioByUserId = async (req, res, next) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });

  try {
    const rows = await sql`SELECT * FROM portfolios WHERE user_id = ${userId}`;
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Portfolio not found" });
    res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
};

/**
 * Fetches a portfolio by its ID
 * Purpose: Provides detailed information for a specific portfolio
 * Inputs: req.params.id
 * Outputs: JSON response with portfolio details
 */
export const getPortfolioById = async (req, res, next) => {
  try {
    const portfolioId = parseInt(req.params.id);
    if (isNaN(portfolioId)) {
      return res.status(400).json({ success: false, message: "Invalid portfolio ID" });
    }

    const results = await sql`SELECT * FROM portfolios WHERE id = ${portfolioId}`;
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "Portfolio not found" });
    }
    res.json({ success: true, data: results[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * Updates the portfolio of the currently authenticated user
 * Purpose: Allows a user to modify their own portfolio
 * Inputs: req.params.id, req.user.id, req.body { ... }
 * Outputs: JSON response with success status
 */
export const updatePortfolio = async (req, res, next) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });

    const portfolioId = parseInt(req.params.id);
    if (isNaN(portfolioId)) {
      return res.status(400).json({ success: false, message: "Invalid portfolio ID" });
    }

    const {
      full_name,
      profession_title,
      phone,
      email,
      location,
      about_me,
      experience_years,
      skills,
      certifications,
      languages,
      availability,
      portfolio_url,
      profile_image_url
    } = req.body;

    try {
      const existing = await sql`
        SELECT * FROM portfolios WHERE id = ${portfolioId} AND user_id = ${userId}
      `;

      if (existing.length === 0) {
        return res.status(404).json({ success: false, message: "Portfolio not found or unauthorized access" });
      }

      await sql`
        UPDATE portfolios
        SET full_name = ${full_name || existing[0].full_name},
            profession_title = ${profession_title || existing[0].profession_title},
            phone = ${phone || existing[0].phone},
            email = ${email || existing[0].email},
            location = ${location || existing[0].location},
            about_me = ${about_me || existing[0].about_me},
            experience_years = ${experience_years ? Number(experience_years) : existing[0].experience_years},
            skills = ${skills || existing[0].skills},
            certifications = ${certifications || existing[0].certifications},
            languages = ${languages || existing[0].languages},
            availability = ${availability || existing[0].availability},
            portfolio_url = ${portfolio_url || existing[0].portfolio_url},
            profile_image_url = ${profile_image_url || existing[0].profile_image_url}
        WHERE id = ${portfolioId} AND user_id = ${userId}
      `;
      res.status(200).json({ success: true, message: "Portfolio updated successfully" });
    } catch (error) {
      next(error);
    }
};

/**
 * Deletes the portfolio of the currently authenticated user
 * Purpose: Allows a user to remove their own portfolio permanently
 * Inputs: req.params.id, req.user.id
 * Outputs: JSON response with success status
 */
export const deletePortfolio = async (req, res, next) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });

    const portfolioId = parseInt(req.params.id);
    if (isNaN(portfolioId)) {
      return res.status(400).json({ success: false, message: "Invalid portfolio ID" });
    }

    try {
      const existing = await sql`
        SELECT * FROM portfolios WHERE id = ${portfolioId} AND user_id = ${userId}
      `;

      if (existing.length === 0) {
        return res.status(404).json({ success: false, message: "Portfolio not found or unauthorized access" });
      }

      await sql`DELETE FROM portfolios WHERE id = ${portfolioId} AND user_id = ${userId}`;

      res.status(200).json({ success: true, message: "Portfolio deleted successfully" });
    } catch (error) {
      next(error);
    }
};
