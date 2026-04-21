import { Signal } from "../types/Signal";
import { ParsedJobPage } from "../services/parser.service";

const FREE_EMAIL_PROVIDERS = new Set([
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "live.com",
  "aol.com", "icloud.com", "protonmail.com", "mail.com", "yandex.com",
  "zoho.com", "gmx.com", "inbox.com", "fastmail.com",
]);

const KNOWN_JOB_BOARDS = new Set([
  "linkedin.com", "indeed.com", "naukri.com", "wellfound.com",
  "glassdoor.com", "monster.com", "shine.com", "timesjobs.com",
  "foundit.in", "internshala.com", "unstop.com", "hirist.com",
  "freshersworld.com", "apna.co", "cutshort.io",
]);

export function emailValiditySignal(data: ParsedJobPage): Signal {
  const email = data.contactEmail;
  const domain = data.companyDomain?.replace(/^www\./, "") ?? "";
  const isJobBoard = KNOWN_JOB_BOARDS.has(domain);


  if (!email && isJobBoard) {
    return {
      id: "email_validity",
      category: "domain_company",
      title: "Contact Email",
      riskLevel: "low",
      value: "Applications via platform",
      confidence: 80,
      icon: "email",
      explanation:
        "This posting is on a job board that handles applications through its own platform. Direct contact emails are not expected here.",
      whyItMatters:
        "Established job boards manage the application process securely. The absence of a direct email is normal and not a risk indicator on these platforms.",
      advice: [
        "Apply through the platform's official Apply button only.",
        "Never send your resume or personal information to an email address found outside the platform.",
      ],
    };
  }

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
        "No contact email address was found in this posting. Legitimate postings on non-platform sites typically include a contact email.",
      whyItMatters:
        "A missing contact email makes it harder to verify who is recruiting and may funnel applications through unverifiable channels.",
      advice: [
        "Use the official company careers page to apply rather than replying to the posting.",
        "Contact the company through their official website contact form.",
        "Search the recruiter's name on LinkedIn to verify their identity.",
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
      explanation:
        "The contact email address appears to be malformed and cannot be used to verify the recruiter.",
      whyItMatters:
        "A malformed email cannot be replied to and suggests the posting was created carelessly or to deceive applicants.",
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
      value: `Uses ${emailDomain}`,
      confidence: 88,
      icon: "email",
      explanation:
        `The recruiter is using a free personal email provider (${emailDomain}) instead of a company domain — a common trait in fraudulent postings.`,
      whyItMatters:
        "Legitimate companies almost always use their corporate email domain for recruitment. Free email addresses are easy to create anonymously, making the recruiter impossible to verify.",
      advice: [
        "Ask the recruiter for a company email and verify it matches the official company website.",
        "Search for the recruiter's name on LinkedIn and cross-reference their employer.",
        "Never share personal documents until the company identity is independently verified.",
      ],
      example:
        "A posting from 'hr.techcorp@gmail.com' instead of 'hr@techcorp.com' is a clear warning sign.",
    };
  }

  const companyDomain = data.companyDomain?.toLowerCase().replace(/^www\./, "");
  const emailMatchesCompany =
    companyDomain &&
    (emailDomain === companyDomain || emailDomain.endsWith(`.${companyDomain}`));

  return {
    id: "email_validity",
    category: "positive",
    title: "Corporate Email Used",
    riskLevel: "low",
    value: emailMatchesCompany ? "Matches company domain" : `Custom domain: ${emailDomain}`,
    confidence: emailMatchesCompany ? 90 : 70,
    icon: "email",
    explanation: emailMatchesCompany
      ? `The contact email matches the company domain — a strong positive signal that the recruiter is genuinely affiliated with the company.`
      : `A custom domain email is used, which is significantly better than a free provider.`,
    whyItMatters:
      "A corporate email matching the company website domain is one of the strongest indicators of a legitimate recruiter.",
    advice: [
      "Still verify the company independently before sharing sensitive information.",
    ],
  };
}