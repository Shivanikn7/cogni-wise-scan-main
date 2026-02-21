const envBase = (import.meta.env.VITE_API_URL as string | undefined)?.trim()
const isDev = import.meta.env.DEV

// In production, default to same-origin ('') so requests go to /api/... on the same host.
// In development, default to the Flask server on localhost:5000 unless VITE_API_URL is set.
const baseUrl = envBase && envBase.length > 0
  ? envBase.replace(/\/$/, "")
  : (isDev ? "http://localhost:5000" : "")

export const API_BASE_URL: string = baseUrl

export const buildApiUrl = (path: string): string => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath
}

