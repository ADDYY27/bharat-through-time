/**
 * Unified API Client for Bharat Through Time
 * Normalizes backend URL from VITE_API_URL and provides robust fetch with retry support
 * for handling Render cold-starts and intermittent network delays.
 */

function resolveApiBase() {
  const envUrl = import.meta.env.VITE_API_URL?.trim();
  if (!envUrl) {
    // In production, fallback to relative /api to support reverse proxy and prevent Mixed Content on HTTPS
    return import.meta.env.PROD ? "/api" : "http://localhost:5000/api";
  }

  // Strip trailing slash
  let base = envUrl.endsWith("/") ? envUrl.slice(0, -1) : envUrl;

  // If user provided origin without /api (e.g. https://bharat-api.onrender.com),
  // append /api unless the path already contains /api
  if (!base.endsWith("/api") && !base.includes("/api/")) {
    base = `${base}/api`;
  }

  return base;
}

export const API_BASE = resolveApiBase();

/**
 * Fetch wrapper with timeout and retry logic
 * @param {string} endpoint - Path relative to API_BASE (e.g. '/history/1780') or full URL
 * @param {RequestInit} [options={}] - Standard fetch options
 * @param {number} [retries=1] - Number of retries on failure (default 1)
 * @param {number} [timeoutMs=15000] - Request timeout in milliseconds (default 15s)
 * @returns {Promise<any>}
 */
export async function fetchApi(endpoint, options = {}, retries = 1, timeoutMs = 15000) {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: options.signal || controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    clearTimeout(timeoutId);

    // If abort was caused by timeout
    const isTimeout = err.name === "AbortError" && !options.signal?.aborted;
    const finalError = isTimeout ? new Error("Request timed out. Server may be starting up.") : err;

    if (retries > 0 && !options.signal?.aborted) {
      // Exponential backoff wait (1.5s) before retrying
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return fetchApi(endpoint, options, retries - 1, timeoutMs);
    }

    throw finalError;
  }
}
