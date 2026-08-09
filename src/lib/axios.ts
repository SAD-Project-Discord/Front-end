import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
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

export default api;
