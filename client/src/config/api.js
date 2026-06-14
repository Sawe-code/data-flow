const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

const localFallbacks = [
  API_URL,
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://localhost:8081",
  "http://127.0.0.1:8081",
];

const API_URLS = [...new Set(localFallbacks)];

export const apiFetch = async (path, options) => {
  let lastError;

  for (const baseUrl of API_URLS) {
    try {
      return await fetch(`${baseUrl}${path}`, options);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
};

export default API_URL;
