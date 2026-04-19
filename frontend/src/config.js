const ENV_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export function getApiUrl() {
  return localStorage.getItem("interiorai_api_url") || ENV_URL;
}

// Keep named export for any existing imports; reads from localStorage at call time
export const API_URL = ENV_URL;
