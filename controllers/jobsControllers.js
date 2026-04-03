import sql from '../config/db.js';

/**
 * Fetches all job postings with optional filters
 * Purpose: Provides a list of approved jobs with search and filter capabilities
 * Inputs: req.query { search, jobTypes, categories, experienceLevels, remote, minSalary, maxSalary }
 * Outputs: JSON response with an array of jobs
 */
export const getAllJobs = async (req, res, next) => {
  try {
    let conditions = [`status = 'approved'`];
    const params = [];
    let paramIndex = 1;

    if (req.query.search) {
      const searchTerm = `%${req.query.search}%`;
      conditions.push(`(advert_title ILIKE $${paramIndex} OR company_name ILIKE $${paramIndex + 1} OR description ILIKE $${paramIndex + 2})`);
      params.push(searchTerm, searchTerm, searchTerm);
      paramIndex += 3;
    }

    if (req.query.jobTypes) {
      const types = req.query.jobTypes.split(',');
      const placeholders = types.map(() => `$${paramIndex++}`).join(',');
      conditions.push(`job_type IN (${placeholders})`);
      params.push(...types);
    }

    if (req.query.categories) {
      const categories = req.query.categories.split(',');
      const placeholders = categories.map(() => `$${paramIndex++}`).join(',');
      conditions.push(`category IN (${placeholders})`);
      params.push(...categories);
    }

    if (req.query.experienceLevels) {
      const levels = req.query.experienceLevels.split(',');
      const placeholders = levels.map(() => `$${paramIndex++}`).join(',');
      conditions.push(`experience_level IN (${placeholders})`);
      params.push(...levels);
    }

    if (req.query.remote) {
      conditions.push(`is_remote = $${paramIndex++}`);
      params.push(req.query.remote === 'true');
    }

    if (req.query.minSalary) {
      conditions.push(`(salary >= $${paramIndex++} OR salary IS NULL)`);
      params.push(parseInt(req.query.minSalary));
    }

    if (req.query.maxSalary) {
      conditions.push(`(salary <= $${paramIndex++} OR salary IS NULL)`);
      params.push(parseInt(req.query.maxSalary));
    }

    const whereClause = conditions.join(' AND ');
    const results = await sql.unsafe(
      `SELECT * FROM job_postings WHERE ${whereClause} ORDER BY created_at DESC`,
      params
    );

    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
};

/**
 * Fetches a single job posting by ID
 * Purpose: Provides detailed information for a specific job
 * Inputs: req.params.id
 * Outputs: JSON response with job details
 */
export const getJobById = async (req, res, next) => {
  try {
    const jobId = parseInt(req.params.id);
    if (isNaN(jobId)) return res.status(400).json({ success: false, message: "Invalid job ID" });

    const results = await sql`SELECT * FROM job_postings WHERE id = ${jobId}`;

    if (results.length === 0) return res.status(404).json({ success: false, message: "Job not found" });

    res.json({ success: true, data: results[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * Creates a new job posting
 * Purpose: Allows users to post new job listings
 * Inputs: req.body { email, username, advert_title, ... }
 * Outputs: JSON response with created job ID
 */
export const createJob = async (req, res, next) => {
  try {
    const {
      email, username, advert_title, location, is_remote = false, job_type, category,
      description, closing_date, application_email_url, salary, salary_currency = 'USD',
      salary_unit = 'Month', company_name, company_website, company_tagline,
      company_video, company_twitter, logo_path, experience_level, education_required
    } = req.body;

    if (!email || !username || !advert_title || !job_type || !category ||
      !description || !application_email_url || !company_name) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const result = await sql`
      INSERT INTO job_postings (
        email, username, advert_title, location, is_remote, job_type, category,
        description, closing_date, application_email_url, salary, salary_currency,
        salary_unit, company_name, company_website, company_tagline, company_video,
        company_twitter, logo_path, experience_level, education_required
      ) VALUES (
        ${email}, ${username}, ${advert_title}, ${location}, ${is_remote}, ${job_type}, ${category},
        ${description}, ${closing_date}, ${application_email_url}, ${salary}, ${salary_currency},
        ${salary_unit}, ${company_name}, ${company_website}, ${company_tagline}, ${company_video},
        ${company_twitter}, ${logo_path}, ${experience_level}, ${education_required}
      ) RETURNING id
    `;

    res.status(201).json({ success: true, message: "Job created successfully", data: { id: result[0].id } });
  } catch (err) {
    next(err);
  }
};

/**
 * Submits a job application
 * Purpose: Records a user's application for a specific job
 * Inputs: req.params.id (jobId), req.body { applicantId, coverLetter, resumeUrl }
 * Outputs: JSON response with application ID
 */
export const applyToJob = async (req, res, next) => {
  try {
    const jobId = parseInt(req.params.id);
    const { applicantId, coverLetter, resumeUrl } = req.body;

    if (!applicantId || !resumeUrl) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const job = await sql`SELECT id FROM job_postings WHERE id = ${jobId}`;
    if (job.length === 0) return res.status(404).json({ success: false, message: "Job not found" });

    const result = await sql`
      INSERT INTO applications (job_id, applicant_id, cover_letter, resume_url, status)
      VALUES (${jobId}, ${applicantId}, ${coverLetter}, ${resumeUrl}, 'pending')
      RETURNING id
    `;

    res.status(201).json({ success: true, message: "Application submitted successfully", data: { applicationId: result[0].id } });
  } catch (err) {
    next(err);
  }
};

/**
 * Fetches all applications for a specific job
 * Purpose: Allows job posters or admins to view applicants
 * Inputs: req.params.id (jobId)
 * Outputs: JSON response with an array of applications
 */
export const getApplications = async (req, res, next) => {
  try {
    const jobId = parseInt(req.params.id);
    const apps = await sql`SELECT * FROM applications WHERE job_id = ${jobId}`;
    res.json({ success: true, data: apps });
  } catch (err) {
    next(err);
  }
};

/**
 * Saves or unsaves a job for a user
 * Purpose: Updates the user's saved list for a specific job
 * Inputs: req.params.id (jobId), req.body { userId, action }
 * Outputs: JSON response with success status
 */
export const saveJob = async (req, res, next) => {
  try {
    const jobId = parseInt(req.params.id);
    const { userId, action } = req.body;

    if (!userId || !action) return res.status(400).json({ success: false, message: "Missing fields" });

    if (action === "save") {
      const existing = await sql`
        SELECT * FROM saved_jobs WHERE user_id = ${userId} AND job_id = ${jobId}
      `;
      if (existing.length === 0) {
        await sql`INSERT INTO saved_jobs (user_id, job_id) VALUES (${userId}, ${jobId})`;
      }
    } else if (action === "unsave") {
      await sql`DELETE FROM saved_jobs WHERE user_id = ${userId} AND job_id = ${jobId}`;
    } else {
      return res.status(400).json({ success: false, message: "Invalid action" });
    }

    res.json({ success: true, message: `Job ${action}d successfully` });
  } catch (err) {
    next(err);
  }
};

/**
 * Fetches saved jobs for a specific user
 * Purpose: Retrieves a list of jobs saved by the user
 * Inputs: req.params.userId
 * Outputs: JSON response with an array of jobs
 */
export const getSavedJobs = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);
    const jobs = await sql`
      SELECT j.* FROM job_postings j
      JOIN saved_jobs s ON j.id = s.job_id
      WHERE s.user_id = ${userId}
    `;
    res.json({ success: true, data: jobs });
  } catch (err) {
    next(err);
  }
};

/**
 * Fetches all unique job categories
 * Purpose: Provides a list of categories for filtering
 * Inputs: None
 * Outputs: JSON response with an array of categories
 */
export const getCategories = async (req, res, next) => {
  try {
    const results = await sql`
      SELECT DISTINCT category FROM job_postings ORDER BY category
    `;
    res.json({ success: true, data: results.map(r => r.category) });
  } catch (err) {
    next(err);
  }
};

/**
 * Fetches jobs similar to a given job ID
 * Purpose: Recommends related jobs based on category
 * Inputs: req.params.id
 * Outputs: JSON response with an array of similar jobs
 */
export const getSimilarJobs = async (req, res, next) => {
  try {
    const jobId = parseInt(req.params.id);
    const currentJob = await sql`SELECT category FROM job_postings WHERE id = ${jobId}`;

    if (currentJob.length === 0) return res.status(404).json({ success: false, message: "Job not found" });

    const similar = await sql`
      SELECT * FROM job_postings
      WHERE category = ${currentJob[0].category} AND id != ${jobId}
      ORDER BY created_at DESC
      LIMIT 4
    `;

    res.json({ success: true, data: similar });
  } catch (err) {
    next(err);
  }
};
