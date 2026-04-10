import UrlInputBar from "../features/analyze/components/UrlInputBar"
import FeatureCard from "../features/analyze/components/FeatureCard"
import { useAnalyzeStore } from "../store/analyzeStore"
import { AlertTriangle, BarChart3, ShieldCheck } from "lucide-react"

const features = [
  {
    icon: <AlertTriangle size={22} color="#f59e0b" />,
    title: "Risk Assessment",
    description: "Identify red flags and potential scam indicators",
  },
  {
    icon: <BarChart3 size={22} color="#2563eb" />,
    title: "Confidence Score",
    description: "Data-driven credibility rating for each posting",
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
          Credify provides estimated risk indicators. Results may not be fully
          accurate. Verify independently.
        </p>

        <section className="features-grid">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </section>
      </div>
    </main>
  )
}