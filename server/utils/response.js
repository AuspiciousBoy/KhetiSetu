/**
 * Standardized API Response Serializers for KhetiSetu
 */

const success = (res, data = {}, message = 'Operation successful', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  });
};

const paginated = (res, data = [], pagination = {}, message = 'Data retrieved successfully') => {
  const {
    page = 1,
    limit = 20,
    total = data.length,
    totalPages = Math.ceil(total / limit) || 1,
  } = pagination;

  return res.status(200).json({
    success: true,
    data,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: Number(total),
      totalPages: Number(totalPages),
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
    message,
  });
};

const error = (
  res,
  message = 'Internal server error',
  code = 'SERVER_ERROR',
  statusCode = 500,
  details = null
) => {
  const requestId = res.req ? res.req.id || res.req.headers['x-request-id'] : undefined;

  const errorPayload = {
    code,
    message,
    ...(requestId ? { requestId } : {}),
  };

  if (details && process.env.NODE_ENV !== 'production') {
    errorPayload.details = details;
  }

  return res.status(statusCode).json({
    success: false,
    error: errorPayload,
  });
};

class ApiError extends Error {
  constructor(statusCode, message, code = 'ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  success,
  paginated,
  error,
  ApiError,
};
