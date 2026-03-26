
import db from "../config/db.js";

// Unified search for jobs and portfolios
export const unifiedSearch = async (req, res) => {
  try {
    const {
      search,
      location,
      jobTypes,
      categories,
      category,            // ← Add this
      industries,
      industry,            // ← Add this
      experienceLevels,
      remote,
      minSalary,
      maxSalary,
    } = req.query;

    const jobParams = [];
    const portfolioParams = [];

    // ---------- Job Query ----------
    let jobQuery = `SELECT * FROM job_postings WHERE 1=1`;

    if (search) {
      const keyword = `%${search}%`;
      jobQuery += ` AND (advert_title LIKE ? OR company_name LIKE ? OR description LIKE ?)`;
      jobParams.push(keyword, keyword, keyword);
    }

    if (location) {
      jobQuery += ` AND location LIKE ?`;
      jobParams.push(`%${location}%`);
    }

    if (jobTypes) {
      const types = jobTypes.split(',');
      jobQuery += ` AND job_type IN (${types.map(() => '?').join(',')})`;
      jobParams.push(...types);
    }

    if (category) {
      jobQuery += ` AND category = ?`;
      jobParams.push(category);
    }

    if (categories) {
      const cats = categories.split(',');
      jobQuery += ` AND category IN (${cats.map(() => '?').join(',')})`;
      jobParams.push(...cats);
    }

    if (experienceLevels) {
      const levels = experienceLevels.split(',');
      jobQuery += ` AND experience_level IN (${levels.map(() => '?').join(',')})`;
      jobParams.push(...levels);
    }

    if (remote) {
      jobQuery += ` AND is_remote = ?`;
      jobParams.push(remote === 'true' ? 1 : 0);
    }

    if (minSalary) {
      jobQuery += ` AND (salary >= ? OR salary IS NULL)`;
      jobParams.push(parseInt(minSalary));
    }

    if (maxSalary) {
      jobQuery += ` AND (salary <= ? OR salary IS NULL)`;
      jobParams.push(parseInt(maxSalary));
    }

    jobQuery += ` ORDER BY created_at DESC`;

    // ---------- Portfolio Query ----------
    let portfolioQuery = `SELECT * FROM portfolios WHERE 1=1`;

    if (search) {
      const keyword = `%${search}%`;
      portfolioQuery += ` AND (full_name LIKE ? OR profession_title LIKE ? OR about_me LIKE ?)`;
      portfolioParams.push(keyword, keyword, keyword);
    }

    if (location) {
      portfolioQuery += ` AND location LIKE ?`;
      portfolioParams.push(`%${location}%`);
    }

    // ---------- Execute both queries ----------
    const [jobs] = await db.promise().query(jobQuery, jobParams);
    const [portfolios] = await db.promise().query(portfolioQuery, portfolioParams);

    res.status(200).json({ jobs, portfolios });
  } catch (err) {
    console.error("Unified search error:", err);
    res.status(500).json({ error: "Search failed" });
  }
};
