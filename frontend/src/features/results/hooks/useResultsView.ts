import { useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAnalyzeStore } from "../../../store/analyzeStore";
import { submitFeedback } from "../../../services/analyze.api";
import type { Signal } from "../../../types/Signal";

const CATEGORIES = ["red_flags","domain_company","domain_info","historical","positive","job_title"] as const;
type Category = (typeof CATEGORIES)[number];

export function useResultsView() {
  const navigate = useNavigate();
  const { result, feedback, setFeedback, reset } = useAnalyzeStore();

  const grouped = useMemo<Record<Category, Signal[]>>(() => {
    const initial: Record<Category, Signal[]> = {
      red_flags:[],
      domain_company:[],
      domain_info:[],
      historical:[],
      positive: [],
      job_title: []
    };

    if (!result) return initial;

    result.signals.forEach((signal) => {
      const key = signal.category as Category;
      if (key in initial) {
        initial[key].push(signal);
      } else {
        initial["domain_company"].push(signal);
      }
    });

    return initial;
  }, [result]);

  const handleFeedback = useCallback(
    async (vote: "correct" | "incorrect") => {
      if (!result || feedback !== null) return;
      setFeedback(vote);

      try {
        await submitFeedback({
          url:       result.url,
          domain:    result.domain,
          riskScore: result.riskScore,
          riskLevel: result.riskLevel,
          vote,
        });
      } catch { }
    },
    [result, feedback, setFeedback]
  );

  return {
    result,
    grouped,
    categories:     CATEGORIES,
    feedback,
    handleFeedback,
    goHome: () => { reset(); navigate("/"); },
  };
}