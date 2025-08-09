// Centralized API base URL and helper to build endpoints
// Note: Env variables are not supported here; choose base by hostname
export const API_BASE =
  typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:8000'
    : 'https://sentimenkopi-com-698955062612.asia-southeast2.run.app';

export function buildUrl(path: string, params?: Record<string, string>) {
  const url = new URL(path, API_BASE);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}
