const { CORS_ORIGINS, isProd } = require('./env');
const logger = require('../utils/logger');

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser agents (cURL, mobile apps, postman) in development if origin is undefined
    if (!origin) {
      if (!isProd) {
        return callback(null, true);
      }
      return callback(new Error('Origin header required in production'), false);
    }

    if (CORS_ORIGINS.includes(origin)) {
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
