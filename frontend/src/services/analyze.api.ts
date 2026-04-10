import axios from "axios"
import type { AnalysisResult } from "../types/AnalysisResult";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
})

export const analyzeUrl = async (url: string): Promise<AnalysisResult> => {
  const response = await api.post<AnalysisResult>("/analyze", { url })
  return response.data
}