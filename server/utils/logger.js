const winston = require('winston');
const { LOG_LEVEL, isProd } = require('../config/env');

// Sensitive keys that must NEVER be written to logs
const SENSITIVE_KEYS = [
  'password',
  'passwordhash',
  'refreshtoken',
  'accesstoken',
  'authorization',
  'secret',
  'cookie',
  'cvv',
  'pin',
  'gemini_api_key',
  'apikey',
  'token',
];

// Helper to mask sensitive fields recursively
const sanitizeLogData = (data) => {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizeLogData);

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some((sensitive) => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeLogData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format((info) => {
    // Redact sensitive details in metadata
    if (info.meta) {
      info.meta = sanitizeLogData(info.meta);
    }
    return info;
  })(),
  isProd
    ? winston.format.json()
    : winston.format.printf(({ timestamp, level, message, requestId, userId, ...meta }) => {
        const reqStr = requestId ? `[${requestId}]` : '';
        const userStr = userId ? `[User:${userId}]` : '';
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(sanitizeLogData(meta))}` : '';
        return `${timestamp} [${level.toUpperCase()}] ${reqStr}${userStr}: ${message}${metaStr}`;
      })
);

const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: customFormat,
  defaultMeta: { service: 'khetisetu-api' },
  transports: [
    new winston.transports.Console(),
  ],
});

module.exports = logger;
