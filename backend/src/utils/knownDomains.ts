export const KNOWN_JOB_BOARDS = new Set([
  "linkedin.com", "indeed.com", "naukri.com", "wellfound.com",
  "glassdoor.com", "monster.com", "shine.com", "timesjobs.com",
  "foundit.in", "internshala.com", "unstop.com", "hirist.com",
  "freshersworld.com", "apna.co", "cutshort.io",
]);

export const ESTABLISHED_DOMAINS = new Set([
  ...KNOWN_JOB_BOARDS,
  "google.com", "microsoft.com", "amazon.com", "flipkart.com",
  "infosys.com", "tcs.com", "wipro.com", "hcltech.com",
  "accenture.com", "deloitte.com", "pwc.com", "kpmg.com",
  "ey.com", "ibm.com", "oracle.com", "sap.com", "salesforce.com",
  "capgemini.com", "cognizant.com", "hexaware.com", "mphasis.com",
  "ltimindtree.com", "techmahindra.com",
]);

export function getRootDomain(domain: string): string {
  const parts = domain.replace(/^www\./, "").split(".");
  return parts.length > 2 ? parts.slice(-2).join(".") : domain;
}

export function isKnownJobBoard(domain: string): boolean {
  return KNOWN_JOB_BOARDS.has(getRootDomain(domain));
}