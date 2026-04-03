import dotenv from "dotenv";

const env = process.env.NODE_ENV || "development";

// Load base env
dotenv.config();

// Load env-specific overrides if present
dotenv.config({ path: `.env.${env}.local` });

// -----------------------------
// REQUIRED VARIABLES
// -----------------------------
const requiredEnv = [
  "PORT",
  "DATABASE_URL",
  "JWT_SECRET",
  "JWT_EXPIRES_IN",
  "FRONTEND_URL"
];

const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  console.error("❌ Missing required environment variables:");
  missingEnv.forEach((key) => console.error(`- ${key}`));
  process.exit(1);
}

// -----------------------------
// NORMALIZE ORIGINS
// -----------------------------
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.LOCAL_FRONTEND_URL
].filter(Boolean);

// remove trailing slash
const ALLOWED_ORIGINS = allowedOrigins.map((origin) =>
  origin.replace(/\/$/, "")
);

// -----------------------------
// EXPORTS
// -----------------------------
export const PORT = process.env.PORT;
export const NODE_ENV = process.env.NODE_ENV;
export const DATABASE_URL = process.env.DATABASE_URL;

export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;

export const FRONTEND_URL = process.env.FRONTEND_URL;
export const LOCAL_FRONTEND_URL = process.env.LOCAL_FRONTEND_URL;

export { ALLOWED_ORIGINS };

// -----------------------------
// DEBUG (safe)
// -----------------------------
console.log(`✅ Running in ${NODE_ENV}`);
console.log(`🌐 Allowed origins:`, ALLOWED_ORIGINS);