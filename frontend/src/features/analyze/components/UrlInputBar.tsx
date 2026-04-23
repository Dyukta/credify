import { useAnalyzeStore } from '../../../store/analyzeStore'
import { useAnalyze } from '../hooks/useAnalyze'

export default function UrlInputBar() {
  const { url, setUrl } = useAnalyzeStore()
  const { analyze, isLoading } = useAnalyze()

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') analyze()
  }

  return (
    <div className="url-input-bar">
      <svg
        className="url-input-icon"
        width="16"
        height="16"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>

      <input
        className="url-input-field"
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={onKey}
        placeholder="Paste job posting URL here"
      />

      <button
        className={`url-input-button${isLoading || !url.trim() ? ' disabled' : ''}`}
        onClick={analyze}
        disabled={isLoading || !url.trim()}
      >
        {isLoading ? 'Analyzing…' : 'Analyze Job'}
      </button>
    </div>
  )
}