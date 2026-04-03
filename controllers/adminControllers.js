import sql from "../config/db.js";

/**
 * Middleware to verify if the authenticated user is an admin
 * Purpose: Restricts access to admin-only routes
 * Inputs: req.user
 * Outputs: Calls next() or returns 403 Forbidden
 */
export function verifyAdmin(req, res, next) {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ success: false, message: "Access denied. Admin privileges required." });
  }
}

/**
 * Fetches all registered users
 * Purpose: Provides a list of all users for admin management
 * Inputs: None
 * Outputs: JSON response with an array of users
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const rows = await sql`
      SELECT id, username, email, role, status, created_at FROM users
    `;
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * Updates a user's status (e.g., active, suspended)
 * Purpose: Allows admin to manage user account availability
 * Inputs: req.params.id, req.body.status
 * Outputs: JSON response with success status
 */
export const updateUserStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["active", "suspended"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status value. Must be 'active' or 'suspended'." });
  }

  try {
    const result = await sql`
      UPDATE users SET status = ${status} WHERE id = ${id} RETURNING id
    `;

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: `User status updated to ${status}` });
  } catch (err) {
    next(err);
  }
};

/**
 * Fetches all pending job postings
 * Purpose: Provides a list of jobs awaiting admin approval
 * Inputs: None
 * Outputs: JSON response with an array of pending jobs
 */
export const getPendingJobs = async (req, res, next) => {
  try {
    const rows = await sql`SELECT * FROM job_postings WHERE status = 'pending'`;
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * Approves a job posting
 * Purpose: Changes job status to 'approved'
 * Inputs: req.params.id
 * Outputs: JSON response with success status
 */
export const approveJob = async (req, res, next) => {
  try {
    const jobId = req.params.id;
    await sql`UPDATE job_postings SET status = 'approved' WHERE id = ${jobId}`;
    res.json({ success: true, message: "Job approved successfully" });
  } catch (err) {
    next(err);
  }
};

/**
 * Rejects a job posting
 * Purpose: Changes job status to 'rejected'
 * Inputs: req.params.id
 * Outputs: JSON response with success status
 */
export const rejectJob = async (req, res, next) => {
  try {
    const jobId = req.params.id;
    await sql`UPDATE job_postings SET status = 'rejected' WHERE id = ${jobId}`;
    res.json({ success: true, message: "Job rejected successfully" });
  } catch (err) {
    next(err);
  }
};
