// src/lib/api/api.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

/**
 * The backend wraps every error as `{ success: false, error: { code, message, details? } }`.
 * `code`/`details` let callers branch on validation errors (e.g. highlight a specific
 * form field) instead of just showing the message string.
 */
export class ApiError extends Error {
  status: number;
  code: string;
  details?: Record<string, string[]>;

  constructor(status: number, code: string, message: string, details?: Record<string, string[]>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function getStoredToken(key: string): string | null {
  return typeof window !== "undefined" ? localStorage.getItem(key) : null;
}

function storeTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

function clearStoredTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

let refreshInFlight: Promise<string | null> | null = null;

/** De-duplicated so concurrent 401s only trigger a single refresh request. */
function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getStoredToken(REFRESH_TOKEN_KEY);
  if (!refreshToken) return Promise.resolve(null);

  if (!refreshInFlight) {
    refreshInFlight = fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) return null;
        const body = await res.json();
        const accessToken: string | undefined = body?.data?.access_token;
        const nextRefreshToken: string | undefined = body?.data?.refresh_token;
        if (!accessToken || !nextRefreshToken) return null;
        storeTokens(accessToken, nextRefreshToken);
        return accessToken;
      })
      .catch(() => null)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const errorInfo = errorBody?.error;
    throw new ApiError(
      response.status,
      errorInfo?.code ?? "UNKNOWN",
      errorInfo?.message ?? `API Error: ${response.status}`,
      errorInfo?.details,
    );
  }
  if (response.status === 204) return {} as T;
  return response.json();
}

function buildHeaders(init: RequestInit, token: string | null): Headers {
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  return headers;
}

export interface FetchApiOptions extends RequestInit {
  /**
   * Skip the automatic 401 -> refresh-token -> retry flow. Used by the auth
   * endpoints themselves (login/register) so a bad password doesn't trigger
   * a pointless refresh attempt and redirect.
   */
  skipAuthRetry?: boolean;
}

export async function fetchApi<T>(endpoint: string, options: FetchApiOptions = {}): Promise<T> {
  const { skipAuthRetry, ...init } = options;
  const token = getStoredToken(ACCESS_TOKEN_KEY);

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...init,
    headers: buildHeaders(init, token),
  });

  if (response.status === 401 && !skipAuthRetry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      const retryResponse = await fetch(`${BASE_URL}${endpoint}`, {
        ...init,
        headers: buildHeaders(init, newToken),
      });
      return parseResponse<T>(retryResponse);
    }

    clearStoredTokens();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }

  return parseResponse<T>(response);
}
