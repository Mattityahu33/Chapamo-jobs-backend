import sql from "../config/db.js";
import jwt from "jsonwebtoken";

export function verifyAdmin(req, res, next) {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ error: "Access denied" });
  }
}

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const rows = await sql`
      SELECT id, username, email, role, status, created_at FROM users
    `;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update user status (suspend/reactivate)
export const updateUserStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["active", "suspended"].includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  try {
    const result = await sql`
      UPDATE users SET status = ${status} WHERE id = ${id} RETURNING id
    `;

    if (result.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: `User status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get pending jobs
export const getPendingJobs = async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM job_postings WHERE status = 'pending'`;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Approve job
export const approveJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    await sql`UPDATE job_postings SET status = 'approved' WHERE id = ${jobId}`;
    res.json({ message: "Job approved successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Reject job
export const rejectJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    await sql`UPDATE job_postings SET status = 'rejected' WHERE id = ${jobId}`;
    res.json({ message: "Job rejected successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
