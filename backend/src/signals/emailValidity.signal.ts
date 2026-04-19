import { Signal } from "../types/Signal";
import { ParsedJobPage } from "../services/parser.service";

const FREE_EMAIL_PROVIDERS = new Set([
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "aol.com",
  "icloud.com",
  "protonmail.com",
  "mail.com",
  "yandex.com",
  "zoho.com",
  "gmx.com",
  "inbox.com",
  "fastmail.com"
]);

export function emailValiditySignal(data: ParsedJobPage): Signal {
  const email = data.contactEmail;

  if (!email) {
    return {
      id: "email_validity",
      category: "red_flags",
      title: "No Contact Email",
      riskLevel: "medium",
      value: "No email found",
      confidence: 55,
      icon: "email",
      explanation:
        "No contact email address was found in the posting. Legitimate postings typically include a contact or application email.",
      whyItMatters:
        "A missing contact email makes it impossible to verify who is recruiting. It may also be a tactic to funnel applications through unverifiable channels.",
      advice: [
        "Use the official company careers page to apply rather than replying to the posting.",
        "Contact the company through their official website contact form.",
      ],
    };
  }

  const emailDomain = email.split("@")[1]?.toLowerCase();

  if (!emailDomain) {
    return {
      id: "email_validity",
      category: "red_flags",
      title: "Invalid Contact Email",
      riskLevel: "high",
      value: email,
      confidence: 85,
      icon: "email",
      explanation: "The contact email address appears to be malformed.",
      whyItMatters:
        "A malformed email address cannot be replied to and suggests the posting was created carelessly or to deceive.",
      advice: [
        "Do not send personal information to this address.",
        "Find the official company website and apply through their careers portal.",
      ],
    };
  }

  if (FREE_EMAIL_PROVIDERS.has(emailDomain)) {
    return {
      id: "email_validity",
      category: "red_flags",
      title: "Suspicious Contact Email",
      riskLevel: "high",
      value: `Uses ${emailDomain} address`,
      confidence: 88,
      icon: "email",
      explanation:
        "The recruiter uses a free email provider instead of a company domain, a common trait in fraudulent postings.",
      whyItMatters:
        "Legitimate companies almost always use their corporate email domain (@company.com) for recruitment. Free email addresses make it easy for scammers to create disposable, untraceable identities.",
      advice: [
        "Ask the recruiter for a company email address and verify it matches the company website.",
        "Search for the recruiter's name on LinkedIn and cross-reference their employer.",
        "Do not share personal documents until you verify the company identity.",
      ],
      example:
        "A posting from 'hr.techcorp@gmail.com' instead of 'hr@techcorp.com' is a warning sign.",
    };
  }

  const companyDomain = data.companyDomain
    ?.toLowerCase()
    .replace(/^www\./, "");
  const emailMatchesCompany =
    companyDomain &&
    (emailDomain === companyDomain ||
      emailDomain.endsWith(`.${companyDomain}`));

  return {
    id: "email_validity",
    category: "positive",
    title: "Corporate Email Used",
    riskLevel: "low",
    value: emailMatchesCompany
      ? "Matches company domain"
      : `Custom domain: ${emailDomain}`,
    confidence: emailMatchesCompany ? 90 : 70,
    icon: "email",
    explanation: emailMatchesCompany
      ? "The contact email matches the company domain, which is a strong positive signal."
      : "A custom domain email is used, which is better than a free provider.",
    whyItMatters:
      "A corporate email that matches the company website domain is one of the strongest indicators that the recruiter is genuinely affiliated with the company.",
    advice: [
      "Still verify the company independently before sharing sensitive information.",
    ],
  };
}