require('dotenv').config();

const app = require('./app');
const prisma = require('./config/database');

const PORT = process.env.PORT || 5000;

// Fail-fast environment variable validation
const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`[Server] Fatal: Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

if (process.env.NODE_ENV === 'production') {
  if (process.env.JWT_SECRET.includes('change_this') || process.env.JWT_SECRET.length < 32) {
    console.error('[Server] Fatal: Insecure or default JWT_SECRET detected in production!');
    process.exit(1);
  }
}

async function startServer() {
  try {
    // Verify database connectivity before accepting requests
    await prisma.$connect();
    console.log('[DB] Connected to Neon PostgreSQL');

    app.listen(PORT, () => {
      console.log(`[Server] Brightloop backend running on port ${PORT} (${process.env.NODE_ENV})`);
    });
  } catch (err) {
    console.error('[Server] Failed to start — database connection error:', err.message);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown(signal) {
  console.log(`[Server] ${signal} received — shutting down gracefully`);
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServer();
