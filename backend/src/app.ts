import express, { Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'

import { rateLimiter } from './middlewares/rateLimiter'
import { requestTimeout } from './middlewares/requestTimeout'
import { errorHandler } from './middlewares/errorHandler'

import analyzeRouter from './routes/analyze.route'

const app = express()
const API_PREFIX = '/api'

app.use(helmet())

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN || '*',
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  })
)

app.use(express.json({ limit: '16kb' }))

app.use(rateLimiter)
app.use(requestTimeout)

app.use(API_PREFIX, analyzeRouter)

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
})

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    status: 404,
    message: 'Route not found',
    code: 'NOT_FOUND',
  })
})

app.use(errorHandler)

export default app