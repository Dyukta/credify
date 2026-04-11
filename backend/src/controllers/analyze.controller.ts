import { Request, Response, NextFunction } from 'express'
import { analyzeJobPosting } from '../services/analyze.service'
import { AnalyzeRequestBody } from '../middlewares/validateRequest'

export async function analyzeController(
  req: Request<object, object, AnalyzeRequestBody>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const url = req.body.url

    const result = await analyzeJobPosting(url)

    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}