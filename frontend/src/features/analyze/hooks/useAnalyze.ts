import { useNavigate } from "react-router-dom";
import { useAnalyzeStore } from "../../../store/analyzeStore";
import { analyzeUrl } from "../../../services/analyze.api";
import axios from "axios";

export function useAnalyze() {
  const navigate = useNavigate();
  const { url, status, setLoading, setResult, setError } = useAnalyzeStore();

  const analyze = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;

    setLoading();

    try {
      const result = await analyzeUrl(trimmed);
      setResult(result);
      navigate("/results");
    } catch (err: unknown) {
      let message = "Failed to analyze. Please try again later.";

      if (axios.isAxiosError(err)) {
        if (err.response?.data?.message) {
          message = err.response.data.message;
        } else if (err.response?.status === 429) {
          message = "Too many requests. Please wait a moment and try again.";
        } else if (err.response?.status === 503 || err.response?.status === 504) {
          message = "The server is temporarily unavailable. Please try again in a few seconds.";
        } else if (err.code === "ERR_NETWORK" || err.code === "ECONNREFUSED") {
          message = "Could not connect to the analysis server. Please make sure the backend is running.";
        } else if (err.code === "ECONNABORTED") {
          message = "The request timed out. Please try again.";
        }
      } else if (err instanceof Error) {
        message = err.message;
      }

      setError(message);
    }
  };

  return {
    analyze,
    isLoading: status === "loading",
  };
}