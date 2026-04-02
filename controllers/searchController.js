import sql from "../config/db.js";

// Unified search for jobs and portfolios
export const unifiedSearch = async (req, res) => {
  try {
    const {
      search,
      location,
      jobTypes,
      categories,
      category,
      industries,
      industry,
      experienceLevels,
      remote,
      minSalary,
      maxSalary,
    } = req.query;

    const jobParams = [];
    const portfolioParams = [];
    let jobParamIndex = 1;
    let portfolioParamIndex = 1;

    // ---------- Job Query ----------
    let jobConditions = [`1=1`];

    if (search) {
      const keyword = `%${search}%`;
      jobConditions.push(`(advert_title ILIKE $${jobParamIndex} OR company_name ILIKE $${jobParamIndex + 1} OR description ILIKE $${jobParamIndex + 2})`);
      jobParams.push(keyword, keyword, keyword);
      jobParamIndex += 3;
    }

    if (location) {
      jobConditions.push(`location ILIKE $${jobParamIndex++}`);
      jobParams.push(`%${location}%`);
    }

    if (jobTypes) {
      const types = jobTypes.split(',');
      const placeholders = types.map(() => `$${jobParamIndex++}`).join(',');
      jobConditions.push(`job_type IN (${placeholders})`);
      jobParams.push(...types);
    }

    if (category) {
      jobConditions.push(`category = $${jobParamIndex++}`);
      jobParams.push(category);
    }

    if (categories) {
      const cats = categories.split(',');
      const placeholders = cats.map(() => `$${jobParamIndex++}`).join(',');
      jobConditions.push(`category IN (${placeholders})`);
      jobParams.push(...cats);
    }

    if (experienceLevels) {
      const levels = experienceLevels.split(',');
      const placeholders = levels.map(() => `$${jobParamIndex++}`).join(',');
      jobConditions.push(`experience_level IN (${placeholders})`);
      jobParams.push(...levels);
    }

    if (remote) {
      jobConditions.push(`is_remote = $${jobParamIndex++}`);
      jobParams.push(remote === 'true');
    }

    if (minSalary) {
      jobConditions.push(`(salary >= $${jobParamIndex++} OR salary IS NULL)`);
      jobParams.push(parseInt(minSalary));
    }

    if (maxSalary) {
      jobConditions.push(`(salary <= $${jobParamIndex++} OR salary IS NULL)`);
      jobParams.push(parseInt(maxSalary));
    }

    // ---------- Portfolio Query ----------
    let portfolioConditions = [`1=1`];

    if (search) {
      const keyword = `%${search}%`;
      portfolioConditions.push(`(full_name ILIKE $${portfolioParamIndex} OR profession_title ILIKE $${portfolioParamIndex + 1} OR about_me ILIKE $${portfolioParamIndex + 2})`);
      portfolioParams.push(keyword, keyword, keyword);
      portfolioParamIndex += 3;
    }

    if (location) {
      portfolioConditions.push(`location ILIKE $${portfolioParamIndex++}`);
      portfolioParams.push(`%${location}%`);
    }

    // ---------- Execute both queries ----------
    const jobs = await sql.unsafe(
      `SELECT * FROM job_postings WHERE ${jobConditions.join(' AND ')} ORDER BY created_at DESC`,
      jobParams
    );
    const portfolios = await sql.unsafe(
      `SELECT * FROM portfolios WHERE ${portfolioConditions.join(' AND ')}`,
      portfolioParams
    );

    res.status(200).json({ jobs, portfolios });
  } catch (err) {
    console.error("Unified search error:", err);
    res.status(500).json({ error: "Search failed" });
  }
};
