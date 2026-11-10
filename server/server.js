const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
const mongoose = require('mongoose');

const { PORT, NODE_ENV, UPLOAD_DIR, isProd } = require('./config/env');
const { connectDB } = require('./config/db');
const helmetConfig = require('./config/helmetConfig');
const corsOptions = require('./config/corsConfig');
const { globalLimiter } = require('./config/rateLimits');
const requestIdMiddleware = require('./middleware/requestId');
const { mongoSanitizer } = require('./security/mongoSanitizer');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const v1Router = require('./routes/v1');

const app = express();

// Trust reverse proxy (nginx, load balancer) in production
if (NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// 1. Security Headers
app.use(helmetConfig);

// 2. Strict CORS
app.use(cors(corsOptions));

// 3. Request Correlation ID
app.use(requestIdMiddleware);

// 4. Request Logging (exclude static uploads from spamming logs)
const morganStream = {
  write: (message) => logger.info(message.trim()),
};
app.use(
  morgan(
    ':remote-addr - :method :url :status :res[content-length] - :response-time ms',
    { stream: morganStream, skip: (req) => req.url.startsWith('/uploads') }
  )
);

// 5. Body Parsing with strict Resource Exhaustion limits (10kb)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// 6. NoSQL Injection Sanitization
app.use(mongoSanitizer);

// 7. Global API Rate Limiter
app.use(globalLimiter);

// 8. Static Uploads (Serving produce photos)
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '1d', etag: true }));

// 9. Health & Readiness Probes (Kubernetes / Docker compatible)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: '1.0.0',
    requestId: req.id,
  });
});

app.get('/ready', (req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  if (!dbReady) {
    return res.status(503).json({
      status: 'NOT_READY',
      database: 'DISCONNECTED',
      requestId: req.id,
    });
  }
  res.status(200).json({
    status: 'READY',
    database: 'CONNECTED',
    requestId: req.id,
  });
});

// 10. Mount API Version 1
app.use('/api/v1', v1Router);

// 11. Serve Static Frontend (Production / Unified Single-Port Mode)
const clientDistPath = path.resolve(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  // Single Page Application (SPA) client fallback for non-API routes (Express 5 compatible)
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      return res.sendFile(path.join(clientDistPath, 'index.html'));
    }
    next();
  });
}

// 12. 404 Route Handler for unmatched API endpoints
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `The requested endpoint '${req.method} ${req.originalUrl}' does not exist on KhetiSetu API.`,
      requestId: req.id,
    },
  });
});

// 12. Centralized Error Handler (Shields internals & stack traces)
app.use(errorHandler);

// Start Server and Database
const startServer = async () => {
  if (isProd) {
    await connectDB();
  } else {
    connectDB().catch((err) => {
      logger.warn('Initial MongoDB connection deferred in dev mode', { error: err.message });
    });
  }

  const server = app.listen(PORT, () => {
    logger.info(`========================================================`);
    logger.info(`  KhetiSetu Production API Server Active`);
    logger.info(`  Listening on: http://localhost:${PORT}`);
    logger.info(`  Environment:  ${NODE_ENV}`);
    logger.info(`  Health Probe: http://localhost:${PORT}/health`);
    logger.info(`========================================================`);
  });

  // Graceful shutdown handling
  const shutdown = async (signal) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      logger.info('HTTP server closed.');
      await mongoose.connection.close(false);
      logger.info('MongoDB connection closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

// Auto-start if executed directly
if (require.main === module) {
  startServer().catch((err) => {
    logger.error('Fatal startup error', { error: err.message, stack: err.stack });
    process.exit(1);
  });
}

module.exports = app;
