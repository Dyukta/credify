import { Signal } from '../types/Signal'
import { ParsedJobPage } from '../services/parser.service'

const QUALITY_KEYWORDS = [
  'responsibilities',
  'qualifications',
  'requirements',
  'experience',
  'skills',
  'duties',
  'deliverables',
  'reporting',
  'team',
  'benefits',
  'compensation',
  'location',
  'remote',
  'hybrid',
  'salary',
]

const RED_FLAG_PHRASES = [
  'work from home',
  'easy money',
  'no experience needed',
  'unlimited earning',
  'be your own boss',
  'financial freedom',
  'training provided',
  'immediate start',
  'urgently hiring',
  'must have paypal',
  'bitcoin',
  'wire transfer',
  'upfront fee',
  'investment required',
]

function scoreCompleteness(description: string): number {
  if (!description || description.trim().length === 0) return 0
  const lowerDesc = description.toLowerCase()
  const keywordsFound = QUALITY_KEYWORDS.filter((kw) =>
    lowerDesc.includes(kw)
  ).length
  return Math.round((keywordsFound / QUALITY_KEYWORDS.length) * 100)
}

function findRedFlagPhrases(description: string): string[] {
  const lowerDesc = description.toLowerCase()
  return RED_FLAG_PHRASES.filter((phrase) => lowerDesc.includes(phrase))
}

export function contentQualitySignal(data: ParsedJobPage): Signal {
  const description = data.jobDescription ?? ''
  const completeness = scoreCompleteness(description)
  const redFlags = findRedFlagPhrases(description)
  const wordCount = description.trim().split(/\s+/).filter(Boolean).length

  if (redFlags.length > 0) {
    return {
      id: 'content_quality',
      category: 'red_flags',
      title: 'Suspicious Job Description Language',
      riskLevel: 'high',
      value: `${redFlags.length} red flag phrase${redFlags.length > 1 ? 's' : ''} detected`,
      confidence: 90,
      explanation: `The description contains phrases commonly associated with scam job postings: "${redFlags[0]}".`,
      advice: [
        'Do not pay any upfront fees for training, equipment, or background checks.',
        'Legitimate employers never ask for payment from candidates.',
        'Report suspicious postings to the platform where you found them.',
      ],
      example:
        'Scam postings often use urgency language like "urgently hiring" or promise unrealistic earnings.',
    }
  }

  if (wordCount < 50 || completeness < 25) {
    return {
      id: 'content_quality',
      category: 'red_flags',
      title: 'Vague Job Description',
      riskLevel: 'high',
      value: `Completeness: ${completeness}%`,
      confidence: 92,
      explanation:
        'The posting lacks specific responsibilities, qualifications, and deliverables — a common scam pattern.',
      advice: [
        'Ask the recruiter for a detailed job description before proceeding.',
        'Legitimate companies provide clear role expectations.',
        'Avoid postings that are intentionally vague about what the job entails.',
      ],
      example:
        'Scam postings are often vague to attract as many victims as possible.',
    }
  }

  if (completeness < 50) {
    return {
      id: 'content_quality',
      category: 'red_flags',
      title: 'Incomplete Job Description',
      riskLevel: 'medium',
      value: `Completeness: ${completeness}%`,
      confidence: 70,
      explanation:
        'The posting is missing several key details that legitimate job descriptions usually include.',
      advice: [
        'Request more details about responsibilities and requirements before applying.',
        'Check if the company has listed the role on LinkedIn or their official careers page.',
      ],
    }
  }

  return {
    id: 'content_quality',
    category: 'positive',
    title: 'Detailed Job Description',
    riskLevel: 'low',
    value: `Completeness: ${completeness}%`,
    confidence: 80,
    explanation:
      'The posting includes specific responsibilities, qualifications, and role details — a positive credibility signal.',
    advice: [
      'Continue standard verification before sharing sensitive personal information.',
    ],
  }
}