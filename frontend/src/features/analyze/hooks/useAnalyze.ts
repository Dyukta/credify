import { useNavigate } from "react-router-dom";
import { useAnalyzeStore } from "../../../store/analyzeStore";
import { analyzeUrl } from "../../../services/analyze.api";

export function useAnalyze() {
  const navigate = useNavigate();

  const { url, status, setLoading, setResult, setError } =
    useAnalyzeStore();

  const analyze = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;

    setLoading();

    try {
      const result = await analyzeUrl(trimmed);
      setResult(result);
      navigate("/results");
    } catch (err: any) {
      const message =
        err?.response?.data?.message ??
        "Failed to analyze. Please try again.";

      setError(message);
    }
  };

  return {
    analyze,
    isLoading: status === "loading",
  };
}