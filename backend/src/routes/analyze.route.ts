import { Router } from 'express'
import { validateRequest } from '../middlewares/validateRequest'
import { analyzeController } from '../controllers/analyze.controller'

const analyzeRouter = Router()

analyzeRouter.post('/analyze', validateRequest, analyzeController)

export default analyzeRouter