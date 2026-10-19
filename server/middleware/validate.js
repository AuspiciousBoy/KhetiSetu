const { error } = require('../utils/response');

/**
 * Zod schema validation middleware factory
 * @param {import('zod').ZodSchema} schema
 * @param {'body' | 'query' | 'params'} source
 */
const validate = (schema, source = 'body') => {
  return async (req, res, next) => {
    try {
      const dataToValidate = req[source];
      const parsed = await schema.parseAsync(dataToValidate);
      // Replace with strictly parsed and stripped data (prevents mass assignment & unknown field injection)
      req[source] = parsed;
      next();
    } catch (err) {
      if (err.errors) {
        const issues = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return error(
          res,
          issues[0]?.message || 'Input validation failed',
          'VALIDATION_FAILED',
          400,
          issues
        );
      }
      return error(res, 'Malformed input payload', 'INVALID_INPUT', 400);
    }
  };
};

module.exports = validate;
