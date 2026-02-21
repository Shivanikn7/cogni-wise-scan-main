const isDev = import.meta.env.DEV
const getBaseUrl = () => {
  const envUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  const isDev = import.meta.env.DEV;

  if (envUrl && envUrl.length > 0) {
    return envUrl.replace(/\/$/, "");
  }
  
  // In production, always default to empty string for relative paths
  return isDev ? "http://localhost:5000" : "";
};

export const API_BASE_URL: string = getBaseUrl();

export const buildApiUrl = (path: string): string => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  // Use relative paths if API_BASE_URL is empty
  return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
};