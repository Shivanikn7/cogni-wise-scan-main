const isDev = import.meta.env.DEV
const baseUrl = envBase && envBase.length > 0
  ? envBase.replace(/\/$/, "")
  : (isDev ? "http://localhost:5000" : "")

export const API_BASE_URL: string = baseUrl

export const buildApiUrl = (path: string): string => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath
}

