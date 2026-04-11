import { AppError } from '../types/AppError'

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:'])

export function sanitizeUrl(rawUrl: string): URL {
  let url: URL

  try {
    url = new URL(rawUrl.trim())
  } catch {
    throw new AppError(
      `Invalid URL format: ${rawUrl}`,
      400,
      'INVALID_URL_FORMAT'
    )
  }

  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    throw new AppError(
      `Protocol not allowed: ${url.protocol}`,
      400,
      'INVALID_URL_PROTOCOL'
    )
  }

  if (!url.hostname) {
    throw new AppError(
      'URL must contain a valid hostname',
      400,
      'INVALID_URL_HOSTNAME'
    )
  }

  return url
}