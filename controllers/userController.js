import sql from "../config/db.js";

// ✅ Save a job
export const saveJob = async (req, res) => {
  const { userId } = req.body;
  const { jobId } = req.params;

  if (!userId || !jobId) {
    return res.status(400).json({ error: "User ID and Job ID are required." });
  }

  try {
    await sql`
      INSERT INTO saved_jobs (user_id, job_id, status)
      VALUES (${userId}, ${jobId}, 'saved')
      ON CONFLICT (user_id, job_id) DO UPDATE
      SET status = 'saved', updated_at = CURRENT_TIMESTAMP
    `;

    return res.status(200).json({ message: "Job saved successfully." });
  } catch (err) {
    console.error("❌ Error saving job:", err);
    return res.status(500).json({ error: "Failed to save job." });
  }
};

// ✅ Unsave a job
export const unsaveJob = async (req, res) => {
  const { jobId } = req.params;
  const { userId } = req.body;

  if (!userId || !jobId) {
    return res.status(400).json({ error: "User ID and Job ID are required." });
  }

  try {
    const result = await sql`
      DELETE FROM saved_jobs WHERE user_id = ${userId} AND job_id = ${jobId} RETURNING id
    `;

    if (result.length === 0) {
      return res.status(404).json({ error: "Job not found in saved list." });
    }

    return res.status(200).json({ message: "Job unsaved successfully.", jobId });
  } catch (err) {
    console.error("❌ Error unsaving job:", err);
    return res.status(500).json({ error: "Failed to unsave job." });
  }
};

// ✅ Get all saved jobs for the logged-in user
export const getSavedJobs = async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required." });
  }

  try {
    const rows = await sql`
      SELECT sj.id AS saved_id, sj.status, sj.saved_at, sj.updated_at,
             j.id AS job_id, j.advert_title AS title, j.company_name,
             j.location, j.salary, j.salary_currency, j.salary_unit, j.is_remote,
             j.job_type, j.category, j.experience_level
      FROM saved_jobs sj
      JOIN job_postings j ON sj.job_id = j.id
      WHERE sj.user_id = ${userId}
    `;

    return res.status(200).json(rows);
  } catch (err) {
    console.error("❌ Error fetching saved jobs:", err);
    return res.status(500).json({ error: "Failed to fetch saved jobs." });
  }
};
