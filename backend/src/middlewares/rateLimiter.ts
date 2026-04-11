import rateLimit from 'express-rate-limit'

export const rateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,

  handler: (_req, res, _next, options) => {
    res.status(options.statusCode).json({
      status: options.statusCode,
      message: 'Too many requests. Please wait before trying again.',
      code: 'RATE_LIMIT_EXCEEDED',
    })
  },
})