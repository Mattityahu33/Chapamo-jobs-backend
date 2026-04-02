import sql from '../config/db.js';

// Get all job postings
export const getAllJobs = async (req, res) => {
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

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
};

// Get single job posting
export const getJobById = async (req, res) => {
  try {
    const jobId = parseInt(req.params.id);
    if (isNaN(jobId)) return res.status(400).json({ error: "Invalid job ID" });

    const results = await sql`SELECT * FROM job_postings WHERE id = ${jobId}`;

    if (results.length === 0) return res.status(404).json({ error: "Job not found" });

    res.json(results[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch job details" });
  }
};

// Create a job posting
export const createJob = async (req, res) => {
  try {
    const {
      email, username, advert_title, location, is_remote = false, job_type, category,
      description, closing_date, application_email_url, salary, salary_currency = 'USD',
      salary_unit = 'Month', company_name, company_website, company_tagline,
      company_video, company_twitter, logo_path, experience_level, education_required
    } = req.body;

    if (!email || !username || !advert_title || !job_type || !category ||
      !description || !application_email_url || !company_name) {
      return res.status(400).json({ error: "Missing required fields" });
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

    res.status(201).json({ message: "Job created", id: result[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create job" });
  }
};

// Submit application
export const applyToJob = async (req, res) => {
  try {
    const jobId = parseInt(req.params.id);
    const { applicantId, coverLetter, resumeUrl } = req.body;

    if (!applicantId || !resumeUrl) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const job = await sql`SELECT id FROM job_postings WHERE id = ${jobId}`;
    if (job.length === 0) return res.status(404).json({ error: "Job not found" });

    const result = await sql`
      INSERT INTO applications (job_id, applicant_id, cover_letter, resume_url, status)
      VALUES (${jobId}, ${applicantId}, ${coverLetter}, ${resumeUrl}, 'pending')
      RETURNING id
    `;

    res.status(201).json({ message: "Application submitted", applicationId: result[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit application" });
  }
};

// Get applications for job
export const getApplications = async (req, res) => {
  try {
    const jobId = parseInt(req.params.id);
    const apps = await sql`SELECT * FROM applications WHERE job_id = ${jobId}`;
    res.json(apps);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
};

// Save/unsave job
export const saveJob = async (req, res) => {
  try {
    const jobId = parseInt(req.params.id);
    const { userId, action } = req.body;

    if (!userId || !action) return res.status(400).json({ error: "Missing fields" });

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
      return res.status(400).json({ error: "Invalid action" });
    }

    res.json({ message: `Job ${action}d successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save/unsave job" });
  }
};

// Get saved jobs
export const getSavedJobs = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const jobs = await sql`
      SELECT j.* FROM job_postings j
      JOIN saved_jobs s ON j.id = s.job_id
      WHERE s.user_id = ${userId}
    `;
    res.json(jobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch saved jobs" });
  }
};

// Get job categories
export const getCategories = async (req, res) => {
  try {
    const results = await sql`
      SELECT DISTINCT category FROM job_postings ORDER BY category
    `;
    res.json(results.map(r => r.category));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};

// Get similar jobs
export const getSimilarJobs = async (req, res) => {
  try {
    const jobId = parseInt(req.params.id);
    const currentJob = await sql`SELECT category FROM job_postings WHERE id = ${jobId}`;

    if (currentJob.length === 0) return res.status(404).json({ error: "Job not found" });

    const similar = await sql`
      SELECT * FROM job_postings
      WHERE category = ${currentJob[0].category} AND id != ${jobId}
      ORDER BY created_at DESC
      LIMIT 4
    `;

    res.json(similar);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch similar jobs" });
  }
};