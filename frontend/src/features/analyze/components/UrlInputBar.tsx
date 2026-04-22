import { useAnalyzeStore } from '../../../store/analyzeStore'
import { useAnalyze } from '../hooks/useAnalyze'

export default function UrlInputBar() {
  const { url, setUrl } = useAnalyzeStore()
  const { analyze, isLoading } = useAnalyze()

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') analyze()
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      background: '#fff',
      border: '1.5px solid #e2e8f0',
      borderRadius: 12,
      padding: '6px 6px 6px 16px',
      gap: 8,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
    }}>
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth="2">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={onKey}
        placeholder="Paste job posting URL here..."
        style={{
          flex: 1,
          border: 'none',
          outline: 'none',
          fontSize: 15,
          color: '#1a1a1a',
          background: 'transparent',
        }}
      />
      <button
        onClick={analyze}
        disabled={isLoading || !url.trim()}
        style={{
          background: isLoading ? '#93c5fd' : '#2563eb',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '10px 22px',
          fontSize: 14,
          fontWeight: 500,
          cursor: isLoading || !url.trim() ? 'not-allowed' : 'pointer',
          transition: 'background 0.15s',
          whiteSpace: 'nowrap',
        }}
      >
        {isLoading ? 'Analyzing…' : 'Analyze Job'}
      </button>
    </div>
  )
}