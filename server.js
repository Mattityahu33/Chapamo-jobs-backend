import app from "./index.js";
import { PORT } from "./config/env.js";

// The server entry point
// This file starts the Express application on the configured port.

const server = app.listen(PORT, () => {
  console.log(`🟢 Server process started successfully`);
  console.log(`🚀 Network: http://localhost:${PORT}`);
  console.log(`📌 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
