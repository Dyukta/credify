import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, AlertTriangle, ThumbsUp, ThumbsDown, CheckCircle } from "lucide-react";
import { useResultsView } from "../features/results/hooks/useResultsView";
import ScorePanel from "../features/results/components/ScorePanel";
import ConfidenceBar from "../features/results/components/ConfidenceBar";
import KeySignalsList from "../features/results/components/KeySignalsList";
import InsightSection from "../features/results/components/InsightSection";
import SafeChecklist from "../features/results/components/SafeChecklist";

export default function Results() {
  const navigate = useNavigate();
  const { result, grouped, categories, feedback, handleFeedback, goHome } = useResultsView();

  useEffect(() => {
    if (!result) navigate("/");
  }, [result, navigate]);

  if (!result) return null;

  const hostname = (() => {
    try { return new URL(result.url).hostname; }
    catch { return result.url; }
  })();

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

      {result.isPartialData && (
        <div className="banner banner-warning">
          <AlertTriangle size={15} />
          <span>
            <strong>Limited access:</strong> This site restricted automated
            access only partial data was available. Some signals have reduced
            confidence. Manual verification is recommended.
          </span>
        </div>
      )}

      <div className="results-layout">

        <aside className="results-sidebar">
          <ScorePanel
            riskScore={result.riskScore}
            riskLevel={result.riskLevel}
            scoreDrivers={result.scoreDrivers ?? []}
          />
          <ConfidenceBar confidence={result.confidence} />
          <KeySignalsList signals={result.signals} />
        </aside>

        <main className="results-main">

          {result.verdictSummary && (
            <div className={`verdict-summary verdict-${result.riskLevel}`}>
              <p>{result.verdictSummary}</p>
            </div>
          )}

          <div className="insight-header">
            <h2>Detailed Insights</h2>
            <p>
              Each signal includes a measured value, explanation and actionable
              steps. Expand for full details.
            </p>
          </div>

          {categories.map((cat) => (
            <InsightSection key={cat} category={cat} signals={grouped[cat] ?? []} />
          ))}

          <SafeChecklist items={result.safetyChecklist} />

          <div className="feedback-section">
            <p className="feedback-question">Was this helpful?</p>

            {feedback === null ? (
              <div className="feedback-buttons">
                <button
                  className="feedback-btn feedback-btn-correct"
                  onClick={() => handleFeedback("correct")}
                >
                  <ThumbsUp size={15} />
                  <span>Yes</span>
                </button>
                <button
                  className="feedback-btn feedback-btn-incorrect"
                  onClick={() => handleFeedback("incorrect")}
                >
                  <ThumbsDown size={15} />
                  <span>No</span>
                </button>
              </div>
            ) : (
              <div className="feedback-submitted">
                <CheckCircle size={15} />
                <span>
                  Thanks — you marked this as{" "}
                  <strong>{feedback === "correct" ? "accurate" : "inaccurate"}</strong>.
                  This helps improve Credify.
                </span>
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}