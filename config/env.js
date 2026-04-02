import dotenv from "dotenv";

const env = process.env.NODE_ENV || "development";

// Load base .env first
dotenv.config();

// Then override with environment-specific file if it exists
dotenv.config({ path: `.env.${env}.local` });

export const {
  PORT,
  NODE_ENV,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  DATABASE_URL,
  FRONTEND_URL
} = process.env;