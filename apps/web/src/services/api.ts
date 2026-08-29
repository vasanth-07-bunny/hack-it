// Centralized API Base URL configuration for local dev and cloud deployments (Netlify/Vercel)
const env = (import.meta as any).env || {};
const BASE_URL: string = env.VITE_API_URL || '';

export function getApiUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${cleanPath}`;
}

export function getSocketUrl(): string {
  return env.VITE_SOCKET_URL || env.VITE_API_URL || window.location.origin;
}
