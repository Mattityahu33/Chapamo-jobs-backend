import "../config/env.js"; // ensure .env is loaded before reading process.env
import postgres from "postgres";

// Single shared PostgreSQL pool instance
const sql = postgres(process.env.DATABASE_URL, {
  ssl: { rejectUnauthorized: false }, // Required for Supabase/Render
  max: 10,                            // Shared pool size
  idle_timeout: 20,                   // Close idle connections after 20 seconds
  connect_timeout: 10,                // Connection timeout
});

// Test connection and log status
(async () => {
  try {
    await sql`SELECT 1`;
    console.log("🟢 Database connection established successfully (Supabase Pooler)");
  } catch (err) {
    console.error("🔴 Database connection failed:", err.message);
  }
})();

export default sql;