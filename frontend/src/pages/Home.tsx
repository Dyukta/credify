import UrlInputBar from "../features/analyze/components/UrlInputBar"
import FeatureCard from "../features/analyze/components/FeatureCard"
import { useAnalyzeStore } from "../store/analyzeStore"
import { AlertTriangle, Ghost, ShieldCheck } from "lucide-react"

const features = [
  {
    icon: <AlertTriangle size={22} color="#f59e0b" />,
    title: "Risk Assessment",
    description: "Identify red flags and potential scam indicators",
  },
  {
    icon: <Ghost size={22} color="#7c3aed" />,
    title: "Ghost Job Detection",
    description: "Spot stale listings that are no longer actively hiring",
  },
  {
    icon: <ShieldCheck size={22} color="#16a34a" />,
    title: "Safety Guidance",
    description: "Actionable tips to protect yourself when applying",
  },
]

export default function Home() {
  const error = useAnalyzeStore((s) => s.error)

  return (
    <>
      {/* Full-width nav, outside the centered column */}
      <nav className="results-nav">
        <div className="nav-brand">
          <ShieldCheck size={18} />
          <span>Credify</span>
        </div>
      </nav>

      <main className="page-center">
        <div className="container-sm">
          <h1 className="hero-title">
            Analyze Job Posting <br /> Credibility Instantly
          </h1>

          <p className="hero-subtitle">
            Quick insights and guidance before applying
          </p>

          <UrlInputBar />

          {error && <p className="error-text">{error}</p>}

          <p className="disclaimer-text">
            This tool provides informational risk indicators based on publicly
            available data and heuristic analysis. Results are estimates and may
            not be complete or fully accurate. This analysis should not be
            considered professional, legal, or security advice. Users are
            responsible for independently verifying job postings and making
            their own decisions before taking any action.
          </p>

          <section className="features-grid">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </section>
        </div>
      </main>
    </>
  )
}