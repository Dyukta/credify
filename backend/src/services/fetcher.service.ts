import axios from 'axios'
import { sanitizeUrl } from '../utils/sanitizeUrl'
import { ssrfGuard } from '../utils/ssrfGuard'
import { AppError } from '../types/AppError'

const axiosInstance = axios.create({
  timeout: 8000,
  maxRedirects: 5,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (compatible; Credify/1.0; +https://credify.app/bot)',
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
  },
})

export async function fetchJobPage(rawUrl: string): Promise<string> {
  const parsed = sanitizeUrl(rawUrl.trim())

  await ssrfGuard(parsed.hostname)

  try {
    const response = await axiosInstance.get<string>(parsed.href, {
      responseType: 'text',
      validateStatus: () => true,
    })

    const status = response.status

    if (status === 401 || status === 403) {
      throw new AppError(
        'Access to this URL is forbidden. The site may block automated requests.',
        400,
        'FETCH_FORBIDDEN'
      )
    }

    if (status === 404) {
      throw new AppError(
        'The job posting URL returned a 404 — the page may have been removed.',
        400,
        'FETCH_NOT_FOUND'
      )
    }

    if (status >= 500) {
      throw new AppError(
        'The target site returned a server error while fetching the page.',
        502,
        'FETCH_FAILED'
      )
    }

    const contentType = response.headers['content-type'] ?? ''

    if (!/text\/html|application\/xhtml/i.test(contentType)) {
      throw new AppError(
        `URL did not return an HTML page (received: ${contentType})`,
        400,
        'INVALID_CONTENT_TYPE'
      )
    }

    if (!response.data || response.data.trim().length === 0) {
      throw new AppError('The fetched page is empty', 400, 'EMPTY_PAGE')
    }

    return response.data
  } catch (err) {
    if (err instanceof AppError) throw err

    if (axios.isAxiosError(err)) {
      if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
        throw new AppError(
          'The request to the job posting URL timed out.',
          504,
          'FETCH_TIMEOUT'
        )
      }

      throw new AppError(
        `Failed to fetch job posting: ${err.message}`,
        502,
        'FETCH_FAILED'
      )
    }

    throw new AppError(
      'Unexpected error occurred while fetching the URL',
      500,
      'FETCH_UNKNOWN'
    )
  }
}