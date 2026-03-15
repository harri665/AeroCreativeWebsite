/**
 * Backend & imgproxy URL configuration.
 *
 * In development: empty strings (Vite proxy handles routing)
 * In production:  set via env vars in .env.production
 *
 * To change these, edit client/.env.production or set the env vars
 * in the GitHub Actions workflow.
 */
export const API_URL = import.meta.env.VITE_API_URL || '';
export const IMGPROXY_URL = import.meta.env.VITE_IMGPROXY_URL || '';

/**
 * Build an imgproxy URL for a given source image.
 * In dev, routes through Express /api/img proxy.
 * In production, goes directly to the imgproxy domain.
 */
export function imgUrl(src, processing = 'rs:fill:560:0/q:85') {
  if (!src) return src;
  const base = IMGPROXY_URL || `${API_URL}/api/img`;
  return `${base}/insecure/${processing}/plain/${src}`;
}
