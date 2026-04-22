import axios from "axios";
import type { AnalysisResult } from "../types/AnalysisResult";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

export const analyzeUrl = async (url: string): Promise<AnalysisResult> => {
  const response = await api.post<AnalysisResult>("/analyze", { url });
  return response.data;
};

export const submitFeedback = async (payload: {
  url: string;
  domain: string;
  riskScore: number;
  riskLevel: string;
  vote: "correct" | "incorrect";
}): Promise<void> => {
  await api.post("/feedback", payload);
};