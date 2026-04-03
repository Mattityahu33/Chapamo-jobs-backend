import dotenv from "dotenv";
import path from "path";

const env = process.env.NODE_ENV || "development";

// Load base .env first
dotenv.config();

// Then override with environment-specific file if it exists
const envPath = `.env.${env}.local`;
dotenv.config({ path: envPath });

// Required environment variables
const requiredEnv = [
  "PORT",
  "DATABASE_URL", // ⚠️ REQUIRED: Set this to your Supabase PostgreSQL pooler URL
  "JWT_SECRET",   // ⚠️ REQUIRED: Set this for JWT signing
  "FRONTEND_URL"  // ⚠️ REQUIRED: Set this to your Vercel frontend URL
];

// Validate missing variables
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  console.error("❌ CRITICAL ERROR: Missing required environment variables:");
  missingEnv.forEach((key) => console.error(`   - ${key}`));
  console.error("\nServer is shutting down. Please check your .env files.");
  process.exit(1);
}

export const {
  PORT,
  NODE_ENV,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  DATABASE_URL,
  FRONTEND_URL,
  LOCAL_FRONTEND_URL
} = process.env;