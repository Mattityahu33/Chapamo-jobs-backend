import { config } from "dotenv";

const env = process.env.NODE_ENV || "development";

// Load environment-specific file first
config({ path: `.env.${env}.local` });

// Fallback to default .env
config();

export const {
  PORT,
  NODE_ENV,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  DATABASE_URL
} = process.env;