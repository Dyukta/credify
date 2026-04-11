import { Request, Response, NextFunction } from 'express'
import { AppError } from '../types/AppError'
import pino from 'pino'

const logger = pino({ name: 'error-handler' })

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    logger.warn(
      {
        code: err.code,
        statusCode: err.statusCode,
        path: req.path,
        method: req.method,
      },
      err.message
    )

    res.status(err.statusCode).json({
      status: err.statusCode,
      message: err.message,
      code: err.code,
    })
    return
  }

  const error = err instanceof Error ? err : new Error(String(err))

  logger.error(
    {
      err: error,
      path: req.path,
      method: req.method,
    },
    'Unhandled error'
  )

  res.status(500).json({
    status: 500,
    message: 'An unexpected error occurred',
    code: 'INTERNAL_SERVER_ERROR',
  })
}