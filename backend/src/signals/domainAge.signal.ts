import { Signal } from '../types/Signal'
import { ParsedJobPage } from '../services/parser.service'

export function domainAgeSignal(data: ParsedJobPage): Signal {
  const domainAgeDays = data.domainAgeDays

  if (domainAgeDays === null) {
    return {
      id: 'domain_age',
      category: 'domain_info',
      title: 'Domain Age',
      riskLevel: 'medium',
      value: 'Unknown',
      confidence: 40,
      explanation:
        'The domain age could not be determined. This may indicate an obscure or recently registered domain.',
      advice: [
        'Search the company name independently to verify its history.',
        'Check if the company has a LinkedIn or Crunchbase profile with a founding date.',
      ],
    }
  }

  if (domainAgeDays < 90) {
    const months = Math.round(domainAgeDays / 30)
    return {
      id: 'domain_age',
      category: 'domain_info',
      title: 'Domain Age',
      riskLevel: 'high',
      value: `Registered ${months} month${months !== 1 ? 's' : ''} ago`,
      confidence: 72,
      explanation:
        "The company's website domain was registered recently, which may indicate a newly created front.",
      advice: [
        'Search for the company name on LinkedIn and Glassdoor.',
        'Look for independent news or press coverage of this company.',
        'Avoid providing personal information until you can verify the company is legitimate.',
      ],
      example:
        'Scam postings frequently use domains registered days or weeks before the posting.',
    }
  }

  if (domainAgeDays < 365) {
    return {
      id: 'domain_age',
      category: 'domain_info',
      title: 'Domain Age',
      riskLevel: 'medium',
      value: `Registered ${Math.round(domainAgeDays / 30)} months ago`,
      confidence: 60,
      explanation:
        'The domain is less than a year old. This could be a new but legitimate company.',
      advice: [
        'Verify the company exists through independent sources.',
        'Check LinkedIn for company presence and employee profiles.',
      ],
    }
  }

  const years = Math.round(domainAgeDays / 365)
  return {
    id: 'domain_age',
    category: 'domain_info',
    title: 'Domain Age',
    riskLevel: 'low',
    value: `Registered ${years} year${years !== 1 ? 's' : ''} ago`,
    confidence: 80,
    explanation:
      'The domain has been registered for over a year, suggesting an established company.',
    advice: [
      'Continue standard verification steps before sharing personal data.',
    ],
  }
}