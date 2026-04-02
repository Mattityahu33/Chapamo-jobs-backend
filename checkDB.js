import "../config/env.js";
import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

const sql = postgres(process.env.DATABASE_URL, {
  ssl: process.env.NODE_ENV === "production" ? "require" : false,
  max: 10,              // max connections
  idle_timeout: 20,     // close idle connections
  connect_timeout: 10,  // connection timeout
});

export default sql;