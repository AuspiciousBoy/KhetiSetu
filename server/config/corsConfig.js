const { CORS_ORIGINS, isProd } = require('./env');
const logger = require('../utils/logger');

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser agents (server-to-server, mobile apps, health checks, Render probes)
    // even in production — these don't send an Origin header.
    if (!origin) {
      return callback(null, true);
    }

    if (
      CORS_ORIGINS.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.includes('kheti-setu') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1')
    ) {
      return callback(null, true);
    }

    logger.warn('CORS blocked untrusted origin', { blockedOrigin: origin });
    return callback(new Error(`Origin '${origin}' not permitted by KhetiSetu CORS policy`), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Request-Id',
    'X-CSRF-Token',
    'Idempotency-Key',
  ],
  exposedHeaders: ['X-Request-Id', 'Content-Range', 'X-Total-Count'],
  maxAge: 86400, // 24 hours
};

module.exports = corsOptions;
