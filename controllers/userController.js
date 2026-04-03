import sql from "../config/db.js";

/**
 * Saves a job for a user
 * Purpose: Associates a job listing with a user's saved list
 * Inputs: req.params.jobId, req.body.userId (should ideally be req.user.id)
 * Outputs: JSON response with success status
 */
export const saveJob = async (req, res, next) => {
  const { userId } = req.body;
  const { jobId } = req.params;

  if (!userId || !jobId) {
    return res.status(400).json({ success: false, message: "User ID and Job ID are required." });
  }

  try {
    await sql`
      INSERT INTO saved_jobs (user_id, job_id, status)
      VALUES (${userId}, ${jobId}, 'saved')
      ON CONFLICT (user_id, job_id) DO UPDATE
      SET status = 'saved', updated_at = CURRENT_TIMESTAMP
    `;

    return res.status(200).json({ success: true, message: "Job saved successfully." });
  } catch (err) {
    next(err);
  }
};

/**
 * Unsaves a job for a user
 * Purpose: Removes a job association from a user's saved list
 * Inputs: req.params.jobId, req.body.userId
 * Outputs: JSON response with success status
 */
export const unsaveJob = async (req, res, next) => {
  const { jobId } = req.params;
  const { userId } = req.body;

  if (!userId || !jobId) {
    return res.status(400).json({ success: false, message: "User ID and Job ID are required." });
  }

  try {
    const result = await sql`
      DELETE FROM saved_jobs WHERE user_id = ${userId} AND job_id = ${jobId} RETURNING id
    `;

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: "Job not found in saved list." });
    }

    return res.status(200).json({ success: true, message: "Job unsaved successfully.", data: { jobId } });
  } catch (err) {
    next(err);
  }
};

/**
 * Fetches all saved jobs for a specific user
 * Purpose: Retrieves a list of jobs saved by the user
 * Inputs: req.query.userId
 * Outputs: JSON response with an array of saved jobs
 */
export const getSavedJobs = async (req, res, next) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ success: false, message: "User ID is required." });
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

    return res.status(200).json({
        success: true,
        data: Array.isArray(rows) ? rows : []
    });
  } catch (err) {
    next(err);
  }
};
