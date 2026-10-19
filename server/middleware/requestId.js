const { v4: uuidv4 } = require('uuid');

/**
 * Assigns a unique X-Request-Id to every inbound request and sets response header.
 */
const requestIdMiddleware = (req, res, next) => {
  const incomingId = req.headers['x-request-id'];
  const requestId = incomingId && typeof incomingId === 'string' && incomingId.length <= 64
    ? incomingId
    : uuidv4();

  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
};

module.exports = requestIdMiddleware;
