import axios, { AxiosError } from "axios";
import { ssrfGuard } from "../utils/ssrfGuard";
import { AppError } from "../types/AppError";
import { isKnownJobPlatform } from "../utils/urlAllowlist";

const axiosInstance = axios.create({
  timeout: 8000,
  maxRedirects: 5,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Upgrade-Insecure-Requests": "1",
    "Cache-Control": "max-age=0",
  },
});

export async function fetchJobPage(sanitizedHref: string): Promise<string> {
  const hostname = new URL(sanitizedHref).hostname;

  await ssrfGuard(hostname);

  const controller = new AbortController();
  const isKnownPlatform = isKnownJobPlatform(hostname);

  try {
    const response = await axiosInstance.get<string>(sanitizedHref, {
      responseType: "text",
      validateStatus: () => true,
      signal: controller.signal,
    });

    const status = response.status;
    if (status === 401 || status === 403) {
      if (isKnownPlatform) {
        if (response.data && response.data.trim().length > 0) {
          return response.data;
        }
        throw new AppError(
          `${hostname} blocks automated access. Try copying the job description text and analyzing it directly, or use the platform's official app.`,
          400,
          "FETCH_PLATFORM_BLOCKED"
        );
      }
      throw new AppError(
        "Access to this URL is forbidden. The site may block automated requests.",
        400,
        "FETCH_FORBIDDEN"
      );
    }

    if (status === 404) {
      throw new AppError(
        "The job posting URL returned a 404 — the page may have been removed or the link may be expired.",
        400,
        "FETCH_NOT_FOUND"
      );
    }

    if (status === 429) {
      throw new AppError(
        "The job posting site is rate limiting requests. Please try again in a few minutes.",
        429,
        "FETCH_RATE_LIMITED"
      );
    }

    if (status >= 500) {
      throw new AppError(
        "The target site returned a server error while fetching the page.",
        502,
        "FETCH_FAILED"
      );
    }

    const contentType = response.headers["content-type"] ?? "";
    if (!/text\/html|application\/xhtml/i.test(contentType)) {
      throw new AppError(
        `URL did not return an HTML page (received: ${contentType})`,
        400,
        "INVALID_CONTENT_TYPE"
      );
    }

    if (!response.data || response.data.trim().length === 0) {
      throw new AppError("The fetched page is empty.", 400, "EMPTY_PAGE");
    }

    return response.data;
  } catch (err) {
    if (err instanceof AppError) throw err;

    if (axios.isCancel(err)) {
      throw new AppError(
        "The request was cancelled due to server timeout.",
        503,
        "FETCH_CANCELLED"
      );
    }

    if (axios.isAxiosError(err)) {
      const axiosErr = err as AxiosError;
      if (axiosErr.code === "ECONNABORTED" || axiosErr.code === "ETIMEDOUT") {
        throw new AppError(
          "The request to the job posting URL timed out.",
          504,
          "FETCH_TIMEOUT"
        );
      }
      throw new AppError(
        `Failed to fetch job posting: ${axiosErr.message}`,
        502,
        "FETCH_FAILED"
      );
    }

    const message = err instanceof Error ? err.message : String(err);
    throw new AppError(
      `Unexpected error occurred while fetching the URL: ${message}`,
      500,
      "FETCH_UNKNOWN"
    );
  }
}