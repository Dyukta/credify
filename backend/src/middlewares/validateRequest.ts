import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'

export const analyzeRequestSchema = z.object({
  url: z
    .string()
    .min(1, 'url cannot be empty')
    .url('url must be a valid URL'),
})

export type AnalyzeRequestBody = z.infer<typeof analyzeRequestSchema>

export function validateRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const parsed = analyzeRequestSchema.safeParse(req.body)

  if (!parsed.success) {
    const errors = parsed.error.issues.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }))

    res.status(400).json({
      status: 400,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors,
    })
    return
  }

  req.body = parsed.data
  next()
}