// config/db.js
import mysql from "mysql2";
import { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, NODE_ENV } from "../config/env.js";

const db = mysql.createConnection({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  }
  console.log(`Connected to MySQL database ${
    NODE_ENV } mode`);
});

export default db;
