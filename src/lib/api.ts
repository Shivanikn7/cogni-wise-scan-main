// src/lib/api.ts

// Check if we are running locally on our computer
const isDev = import.meta.env.DEV;

// FORCE LOGIC: 
// If on Vercel (Production), ALWAYS use "" (relative paths).
// If on local computer (Development), ALWAYS use "http://localhost:5000".
// This completely ignores any stubborn .env files or Vercel variables.
export const API_BASE_URL: string = isDev ? "http://localhost:5000" : "";

export const buildApiUrl = (path: string): string => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};