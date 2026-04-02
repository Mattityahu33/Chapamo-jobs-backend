import sql from "../config/db.js";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.js";

// Helper: extract user ID from JWT cookie
const getUserIdFromToken = (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) {
    res.status(401).json({ error: "Unauthorized. No token." });
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.id;
  } catch (err) {
    res.status(403).json({ error: "Invalid or expired token." });
    return null;
  }
};

// 📌 GET ALL PORTFOLIOS (PUBLIC OR ADMIN)
export const getAllPortfolios = async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM portfolios ORDER BY id DESC`;
    if (rows.length === 0) {
      return res.status(404).json({ error: "No portfolios found" });
    }
    res.status(200).json(rows);
  } catch (error) {
    console.error("Get All Portfolios Error:", error);
    res.status(500).json({ error: "Server error fetching portfolios" });
  }
};

// 📌 CREATE PORTFOLIO
export const createPortfolio = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json({ error: "Unauthorized. No token." });

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(403).json({ error: "Invalid token." });

    const userId = decoded.id;
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
      return res.status(400).json({ error: "Missing required fields." });
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
      res.status(201).json({ message: "Portfolio created successfully" });
    } catch (error) {
      console.error("Portfolio creation failed:", error);
      res.status(500).json({ error: "Server error while creating portfolio" });
    }
  });
};

// 📌 GET USER PORTFOLIO
export const getPortfolioByUserId = async (req, res) => {
  const userId = getUserIdFromToken(req, res);
  if (!userId) return;

  try {
    const rows = await sql`SELECT * FROM portfolios WHERE user_id = ${userId}`;
    if (rows.length === 0) return res.status(404).json({ error: "Portfolio not found" });
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Fetch Portfolio Error:", error);
    res.status(500).json({ error: "Server error fetching portfolio" });
  }
};

// 📌 GET PORTFOLIO BY ID
export const getPortfolioById = async (req, res) => {
  try {
    const portfolioId = parseInt(req.params.id);
    if (isNaN(portfolioId)) {
      return res.status(400).json({ error: "Invalid portfolio ID" });
    }

    const results = await sql`SELECT * FROM portfolios WHERE id = ${portfolioId}`;
    if (results.length === 0) {
      return res.status(404).json({ error: "Portfolio not found" });
    }
    res.json(results[0]);
  } catch (err) {
    console.error("Error fetching portfolio:", err);
    res.status(500).json({ error: "Failed to fetch portfolio details" });
  }
};

// 📌 UPDATE PORTFOLIO
export const updatePortfolio = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json({ error: "Unauthorized. No token." });

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(403).json({ error: "Invalid token." });

    const userId = decoded.id;
    const portfolioId = parseInt(req.params.id);
    if (isNaN(portfolioId)) {
      return res.status(400).json({ error: "Invalid portfolio ID" });
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
        return res.status(404).json({ error: "Portfolio not found or not yours" });
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
      res.status(200).json({ message: "Portfolio updated successfully" });
    } catch (error) {
      console.error("Portfolio update failed:", error);
      res.status(500).json({ error: "Server error while updating portfolio" });
    }
  });
};

// 📌 DELETE PORTFOLIO
export const deletePortfolio = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json({ error: "Unauthorized. No token." });

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(403).json({ error: "Invalid token." });

    const userId = decoded.id;
    const portfolioId = parseInt(req.params.id);
    if (isNaN(portfolioId)) {
      return res.status(400).json({ error: "Invalid portfolio ID" });
    }

    try {
      const existing = await sql`
        SELECT * FROM portfolios WHERE id = ${portfolioId} AND user_id = ${userId}
      `;

      if (existing.length === 0) {
        return res.status(404).json({ error: "Portfolio not found or not yours" });
      }

      await sql`DELETE FROM portfolios WHERE id = ${portfolioId} AND user_id = ${userId}`;

      res.status(200).json({ message: "Portfolio deleted successfully" });
    } catch (error) {
      console.error("Portfolio deletion failed:", error);
      res.status(500).json({ error: "Server error while deleting portfolio" });
    }
  });
};
