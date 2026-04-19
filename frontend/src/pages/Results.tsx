import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { useResultsView } from "../features/results/hooks/useResultsView";
import ScorePanel from "../features/results/components/ScorePanel";
import ConfidenceBar from "../features/results/components/ConfidenceBar";
import KeySignalsList from "../features/results/components/KeySignalsList";
import InsightSection from "../features/results/components/InsightSection";
import SafeChecklist from "../features/results/components/SafeChecklist";
import RegistrationPanel from "../features/results/components/RegistrationPanel";

export default function Results() {
  const navigate = useNavigate();
  const { result, grouped, categories, goHome } = useResultsView();

  useEffect(() => {
    if (!result) navigate("/");
  }, [result, navigate]);

  if (!result) return null;

  const hostname = (() => {
    try {
      return new URL(result.url).hostname;
    } catch {
      return result.url;
    }
  })();

  const registrationSignal = result.signals.find(
    (s) => s.id === "company_registration"
  );

  return (
    <div className="results-page">
      <nav className="results-nav">
        <div className="nav-left">
          <button onClick={goHome} className="nav-back">
            <ArrowLeft size={18} />
          </button>
          <div className="nav-brand">
            <ShieldCheck size={18} />
            <span>Credify</span>
          </div>
        </div>
        <span className="nav-host">{hostname}</span>
      </nav>

      <div className="results-layout">
        <aside className="results-sidebar">
          <ScorePanel riskScore={result.riskScore} riskLevel={result.riskLevel} />
          <ConfidenceBar confidence={result.confidence} />
          <KeySignalsList signals={result.signals} />
        </aside>

        <main className="results-main">
          <div className="insight-header">
            <h2>Detailed Insights</h2>
            <p>
              Each signal includes a measured value, explanation, and actionable
              steps. Expand for full details.
            </p>
          </div>

          {categories.map((cat) => (
            <InsightSection
              key={cat}
              category={cat}
              signals={grouped[cat] ?? []}
            />
          ))}

          <RegistrationPanel signal={registrationSignal} />

          <SafeChecklist items={result.safetyChecklist} />
        </main>
      </div>
    </div>
  );
}