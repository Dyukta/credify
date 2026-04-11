import dns from 'dns/promises'
import { AppError } from '../types/AppError'

const BLOCKED_PATTERNS: RegExp[] = [
  /^127\./,        // loopback
  /^10\./,         // private
  /^192\.168\./,   // private
  /^169\.254\./,   // link-local
  /^::1$/,         // IPv6 loopback
  /^fc00:/i,       // IPv6 private
  /^fe80:/i,       // IPv6 link-local
  /^0\.0\.0\.0$/,  // invalid
]

const isBlockedIp = (ip: string): boolean =>
  BLOCKED_PATTERNS.some((pattern) => pattern.test(ip))

export async function ssrfGuard(hostname: string): Promise<void> {
  try {
    const records = await dns.lookup(hostname, { all: true })

    for (const { address } of records) {
      if (isBlockedIp(address)) {
        throw new AppError(
          'Request to private or internal address is not allowed',
          400,
          'SSRF_BLOCKED'
        )
      }
    }
  } catch (err) {
    if (err instanceof AppError) throw err

    throw new AppError(
      `Unable to resolve hostname: ${hostname}`,
      400,
      'DNS_RESOLUTION_FAILED'
    )
  }
}