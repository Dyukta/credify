import axios, { AxiosError } from "axios";
import { ssrfGuard } from "../utils/ssrfGuard";
import { AppError } from "../types/AppError";
import { isKnownJobPlatform } from "../utils/urlAllowlist";

const axiosInstance = axios.create({
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
    "Cache-Control": "max-age=0"
  },
});

const FETCH_TIMEOUT_MS = 8000;

export async function fetchJobPage(sanitizedHref: string): Promise<string> {
  const hostname = new URL(sanitizedHref).hostname;
  await ssrfGuard(hostname);

  const isKnownPlatform = isKnownJobPlatform(hostname);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await axiosInstance.get<string>(sanitizedHref, {
      responseType: "text",
      validateStatus: () => true,
      signal: controller.signal,
    });

    clearTimeout(timer);
    const status = response.status;
    const body: string = response.data ?? "";

    if (status === 401 || status === 403) {
      if (isKnownPlatform && body.trim().length > 200) {
        return body;
      }
      throw new AppError(
        `This site (${hostname}) blocks automated access. Try pasting the job description text directly instead of the URL.`,
        400,
        "FETCH_FORBIDDEN"
      );
    }

    if (status === 404) {
      throw new AppError(
        "The job posting URL returned a 404 — the listing may have been removed or the link may be expired.",
        400,
        "FETCH_NOT_FOUND"
      );
    }

    if (status === 429) {
      throw new AppError(
        "The job posting site is rate-limiting requests. Please try again in a few minutes.",
        429,
        "FETCH_RATE_LIMITED"
      );
    }

    if (status >= 500) {
      throw new AppError(
        "The target site returned a server error. Please try again later.",
        502,
        "FETCH_TARGET_SERVER_ERROR"
      );
    }

    const contentType = (response.headers["content-type"] ?? "").toLowerCase();
    if (contentType && !contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      throw new AppError(
        `URL did not return an HTML page (received: ${contentType}). Make sure this is a direct link to a job listing.`,
        400,
        "INVALID_CONTENT_TYPE"
      );
    }

    if (body.trim().length === 0) {
      throw new AppError(
        "The fetched page is empty.",
        400,
        "EMPTY_PAGE"
      );
    }

    return body;

  } catch (err) {
    clearTimeout(timer);

    if (err instanceof AppError) throw err;

    if (axios.isCancel(err) || (err instanceof Error && err.name === "AbortError")) {
      throw new AppError(
        "The request to the job posting URL timed out. The site may be slow or blocking requests.",
        504,
        "FETCH_TIMEOUT"
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
      if (axiosErr.code === "ENOTFOUND") {
        throw new AppError(
          `Could not reach ${hostname}. Check that the URL is correct and the site is accessible.`,
          400,
          "FETCH_DNS_FAILED"
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
      `Unexpected error while fetching the URL: ${message}`,
      500,
      "FETCH_UNKNOWN"
    );
  }
}