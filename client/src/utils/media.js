/**
 * Resolves a media / image / QR / proof URL.
 * When the frontend is deployed to a separate domain (e.g., Vercel -> Render backend),
 * relative paths like '/uploads/xyz.png' must be prefixed with the backend URL (VITE_API_URL).
 * Absolute URLs (http://, https://, data:, blob:) are returned as-is.
 */
export const getMediaUrl = (url, fallback = '') => {
  if (!url) return fallback;
  const str = String(url).trim();
  if (!str) return fallback;

  if (
    str.startsWith('http://') ||
    str.startsWith('https://') ||
    str.startsWith('data:') ||
    str.startsWith('blob:')
  ) {
    return str;
  }

  // Strip any accidental /api/v1 or /api or trailing slashes from VITE_API_URL
  const rawEnvUrl = (import.meta.env.VITE_API_URL || '').trim();
  const rootBase = rawEnvUrl.replace(/\/api(\/v\d+)?\/?$/i, '').replace(/\/+$/, '');
  const cleanPath = str.startsWith('/') ? str : `/${str}`;

  return rootBase ? `${rootBase}${cleanPath}` : cleanPath;
};

export default getMediaUrl;
