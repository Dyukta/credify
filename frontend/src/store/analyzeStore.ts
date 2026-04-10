import { create } from "zustand";
import type { AnalysisResult } from "../types/AnalysisResult";

type Status = "idle" | "loading" | "success" | "error";

interface AnalyzeStore {
  url: string;
  status: Status;
  result: AnalysisResult | null;
  error: string | null;

  setUrl: (url: string) => void;
  setLoading: () => void;
  setResult: (result: AnalysisResult) => void;
  setError: (msg: string) => void;
  reset: () => void;
}

export const useAnalyzeStore = create<AnalyzeStore>((set) => ({
  url: "",
  status: "idle",
  result: null,
  error: null,

  setUrl: (url) => set({ url }),

  setLoading: () =>
    set({
      status: "loading",
      error: null,
      result: null,
    }),

  setResult: (result) =>
    set({
      status: "success",
      result,
      error: null,
    }),

  setError: (error) =>
    set({
      status: "error",
      error,
    }),

  reset: () =>
    set({
      url: "",
      status: "idle",
      result: null,
      error: null,
    }),
}));