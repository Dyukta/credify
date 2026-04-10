interface Props {
  icon: React.ReactNode
  title: string
  description: string
}

export default function FeatureCard({ icon, title, description }: Props) {
  return (
    <div className="feature-card">
      <div className="feature-card-icon">
        {icon}
      </div>

      <p className="feature-card-title">
        {title}
      </p>

      <p className="feature-card-description">
        {description}
      </p>
    </div>
  )
}