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

  const rawBase = import.meta.env.VITE_API_URL || '';
  const baseUrl = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;
  const cleanPath = str.startsWith('/') ? str : `/${str}`;

  return baseUrl ? `${baseUrl}${cleanPath}` : cleanPath;
};

export default getMediaUrl;
