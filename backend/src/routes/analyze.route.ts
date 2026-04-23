import { Router } from "express";
import { validateRequest } from "../middlewares/validateRequest";
import { analyzeController, feedbackController } from "../controllers/analyze.controller";

const analyzeRouter = Router();

analyzeRouter.post("/analyze",  validateRequest, analyzeController);
analyzeRouter.post("/feedback", feedbackController); 

export default analyzeRouter;