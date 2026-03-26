import db from '../config/db.js';

// Get all job postings
export const getAllJobs = async (req, res) => {
try {
    let query =  "SELECT * FROM job_postings WHERE status = 'approved'";
    const params = [];

    // Search filter (matches title, company, or description)
    if (req.query.search) {
    query += " AND (advert_title LIKE ? OR company_name LIKE ? OR description LIKE ?)";
    const searchTerm = `%${req.query.search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
    }

    // Job types filter (array)
    if (req.query.jobTypes) {
    const types = req.query.jobTypes.split(',');
    if (types.length > 0) {
        query += " AND job_type IN (?)";
        params.push(types);
    }
    }

    // Categories filter (array)
    if (req.query.categories) {
    const categories = req.query.categories.split(',');
    if (categories.length > 0) {
        query += " AND category IN (?)";
        params.push(categories);
    }
    }

    // Experience levels filter (array)
    if (req.query.experienceLevels) {
    const levels = req.query.experienceLevels.split(',');
    if (levels.length > 0) {
        query += " AND experience_level IN (?)";
        params.push(levels);
    }
    }

    // Remote filter
    if (req.query.remote) {
    query += " AND is_remote = ?";
    params.push(req.query.remote === 'true');
    }

    // Salary range filter
    if (req.query.minSalary) {
    query += " AND (salary >= ? OR salary IS NULL)";
    params.push(parseInt(req.query.minSalary));
    }
    if (req.query.maxSalary) {
    query += " AND (salary <= ? OR salary IS NULL)";
    params.push(parseInt(req.query.maxSalary));
    }

    // Sorting
    query += " ORDER BY created_at DESC";

    const [results] = await db.promise().query(query, params);
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

const [results] = await db.promise().query("SELECT * FROM job_postings WHERE id = ?", [jobId]);

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

const [result] = await db.promise().query(`
    INSERT INTO job_postings (
    email, username, advert_title, location, is_remote, job_type, category,
    description, closing_date, application_email_url, salary, salary_currency,
    salary_unit, company_name, company_website, company_tagline, company_video,
    company_twitter, logo_path, experience_level, education_required
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`, [
    email, username, advert_title, location, is_remote, job_type, category,
    description, closing_date, application_email_url, salary, salary_currency,
    salary_unit, company_name, company_website, company_tagline, company_video,
    company_twitter, logo_path, experience_level, education_required
]);

res.status(201).json({ message: "Job created", id: result.insertId });
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

const [job] = await db.promise().query("SELECT id FROM job_postings WHERE id = ?", [jobId]);
if (job.length === 0) return res.status(404).json({ error: "Job not found" });

const [result] = await db.promise().query(`
    INSERT INTO applications (job_id, applicant_id, cover_letter, resume_url, status)
    VALUES (?, ?, ?, ?, 'pending')
`, [jobId, applicantId, coverLetter, resumeUrl]);

res.status(201).json({ message: "Application submitted", applicationId: result.insertId });
} catch (err) {
console.error(err);
res.status(500).json({ error: "Failed to submit application" });
}
};

// Get applications for job
export const getApplications = async (req, res) => {
try {
const jobId = parseInt(req.params.id);
const [apps] = await db.promise().query("SELECT * FROM applications WHERE job_id = ?", [jobId]);
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
    const [existing] = await db.promise().query(
    "SELECT * FROM saved_jobs WHERE user_id = ? AND job_id = ?", [userId, jobId]
    );
    if (existing.length === 0) {
    await db.promise().query(
        "INSERT INTO saved_jobs (user_id, job_id) VALUES (?, ?)", [userId, jobId]
    );
    }
} else if (action === "unsave") {
    await db.promise().query(
    "DELETE FROM saved_jobs WHERE user_id = ? AND job_id = ?", [userId, jobId]
    );
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
const [jobs] = await db.promise().query(`
    SELECT j.* FROM job_postings j
    JOIN saved_jobs s ON j.id = s.job_id
    WHERE s.user_id = ?
`, [userId]);
res.json(jobs);
} catch (err) {
console.error(err);
res.status(500).json({ error: "Failed to fetch saved jobs" });
}
};

// Get job categories
export const getCategories = async (req, res) => {
try {
const [results] = await db.promise().query(
    "SELECT DISTINCT category FROM job_postings ORDER BY category"
);
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
const [currentJob] = await db.promise().query("SELECT category FROM job_postings WHERE id = ?", [jobId]);

if (currentJob.length === 0) return res.status(404).json({ error: "Job not found" });

const [similar] = await db.promise().query(`
    SELECT * FROM job_postings
    WHERE category = ? AND id != ?
    ORDER BY created_at DESC
    LIMIT 4
`, [currentJob[0].category, jobId]);

res.json(similar);
} catch (err) {
console.error(err);
res.status(500).json({ error: "Failed to fetch similar jobs" });
}
};