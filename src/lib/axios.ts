import axios from "axios";

// Routed through the Next.js rewrite proxy in next.config.ts (same one the
// fetch-based chat API uses) — the backend sends no CORS headers, so a
// direct browser request to it is blocked outright. This must stay in sync
// with NEXT_PUBLIC_API_URL, not a separate env var, or it silently bypasses
// that proxy again.
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const publicRoutes = ["/auth/login", "/auth/register"];

api.interceptors.request.use(
  (config) => {
    // Attach the access token (persisted by AuthStore) as a Bearer credential.
    // Read from localStorage rather than importing the store to avoid a circular
    // dependency (AuthStore -> auth.service -> axios).
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token && !publicRoutes.includes(config.url ?? "")) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let refreshInFlight: Promise<string | null> | null = null;

function refreshAccessToken(): Promise<string | null> {
  const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;
  if (!refreshToken) return Promise.resolve(null);

  if (!refreshInFlight) {
    refreshInFlight = axios
      .post(`${api.defaults.baseURL}/auth/refresh`, { refresh_token: refreshToken })
      .then((res) => {
        const accessToken: string | undefined = res.data?.data?.access_token;
        const nextRefreshToken: string | undefined = res.data?.data?.refresh_token;
        if (!accessToken || !nextRefreshToken) return null;
        localStorage.setItem("access_token", accessToken);
        localStorage.setItem("refresh_token", nextRefreshToken);
        return accessToken;
      })
      .catch(() => null)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    const isAuthRoute = publicRoutes.includes(config?.url ?? "") || config?.url === "/auth/refresh";

    if (error.response?.status === 401 && !isAuthRoute && !config?._retried) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        config._retried = true;
        config.headers.Authorization = `Bearer ${newToken}`;
        return api(config);
      }
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
