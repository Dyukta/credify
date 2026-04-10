import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAnalyzeStore } from "../../../store/analyzeStore";
import type { Signal } from "../../../types/Signal";

const CATEGORIES = [
  "red_flags",
  "domain_company",
  "historical",
  "positive",
] as const;

type Category = (typeof CATEGORIES)[number];

export function useResultsView() {
  const navigate = useNavigate();
  const { result, reset } = useAnalyzeStore();

  const grouped = useMemo<Record<Category, Signal[]>>(() => {
    const initial: Record<Category, Signal[]> = {
      red_flags: [],
      domain_company: [],
      historical: [],
      positive: [],
    };

    if (!result) return initial;

    result.signals.forEach((signal) => {
      initial[signal.category as Category].push(signal);
    });

    return initial;
  }, [result]);

  return {
    result,
    grouped,
    categories: CATEGORIES,
    goHome: () => {
      reset();
      navigate("/");
    },
  };
}