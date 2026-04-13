import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { env } from './config/environment';
import { testConnection } from './config/database';
import { apiRouter } from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';

const app = express();

// Security
app.use(helmet());
app.use(cors({
  origin: env.isDevelopment ? '*' : [env.app.url, env.app.adminUrl],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
  credentials: true,
}));

// Rate limiting
app.use(generalLimiter);

// Logging
app.use(morgan(env.isDevelopment ? 'dev' : 'combined'));

// Body parsing (webhook route needs raw body, handled in route)
app.use((req, res, next) => {
  if (req.originalUrl === `/api/${env.apiVersion}/payments/webhook`) {
    next();
  } else {
    express.json({ limit: '10mb' })(req, res, next);
  }
});
app.use(express.urlencoded({ extended: true }));

// Compression
app.use(compression());

// API Routes
app.use(`/api/${env.apiVersion}`, apiRouter);

// Root route
app.get('/', (_req, res) => {
  res.json({
    name: 'Turneo API',
    version: '1.0.0',
    status: 'running',
    docs: `/api/${env.apiVersion}/health`,
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
async function start() {
  // Test database connection
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.warn('⚠️  Database connection failed. Server will start but DB operations will fail.');
    console.warn('   Make sure your .env file has correct DB credentials.');
  }

  app.listen(env.port, () => {
    console.log(`
╔══════════════════════════════════════════╗
║          🏆 TURNEO API SERVER 🏆         ║
╠══════════════════════════════════════════╣
║  Status:     RUNNING                     ║
║  Port:       ${String(env.port).padEnd(29)}║
║  Env:        ${env.nodeEnv.padEnd(29)}║
║  API:        /api/${env.apiVersion.padEnd(24)}║
║  Database:   ${dbConnected ? 'CONNECTED ✅' : 'DISCONNECTED ❌'}${' '.repeat(dbConnected ? 17 : 14)}║
╚══════════════════════════════════════════╝
    `);
  });
}

start().catch(console.error);

export default app;