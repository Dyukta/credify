import ProgressBar from "../../../shared/ProgressBar"
import { Gauge } from "lucide-react"

interface Props {
  confidence: number
}

export default function ConfidenceBar({ confidence }: Props) {
  return (
    <div className="confidence-panel">
      <div className="confidence-header">
        <Gauge size={16} />
        <span>Confidence</span>
      </div>

      <p className="confidence-value">{confidence}%</p>

      <ProgressBar value={confidence} variant="default" />
    </div>
  )
}