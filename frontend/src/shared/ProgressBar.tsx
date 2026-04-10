interface Props {
  value: number
  height?: number
  variant?: "default" | "success" | "warning" | "danger"
}

export default function ProgressBar({
  value,
  height = 6,
  variant = "default",
}: Props) {
  const safeValue = Math.min(100, Math.max(0, value))

  return (
    <div
      className={`progress progress-${variant}`}
      style={{ height }}
      role="progressbar"
      aria-valuenow={safeValue}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="progress-fill"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  )
}