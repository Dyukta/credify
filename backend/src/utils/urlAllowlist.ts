const KNOWN_JOB_PLATFORMS = new Set<string>(['linkedin.com','indeed.com','glassdoor.com','monster.com','ziprecruiter.com','dice.com','lever.co','greenhouse.io','workday.com','smartrecruiters.com','jobs.ashbyhq.com','boards.greenhouse.io','apply.workable.com','hire.withgoogle.com','careers.google.com','jobs.apple.com','amazon.jobs','careers.microsoft.com'])

const normalizeHost = (hostname: string): string =>
  hostname.replace(/^www\./i, '').toLowerCase()

export function isKnownJobPlatform(hostname: string): boolean {
  const host = normalizeHost(hostname)

  for (const platform of KNOWN_JOB_PLATFORMS) {
    if (host === platform || host.endsWith(`.${platform}`)) return true
  }

  return false
}