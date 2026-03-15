/**
 * API base URL configuration.
 *
 * In development: empty string (Vite proxy handles /api → localhost:3001)
 * In production:  set via VITE_API_URL env var (e.g. https://andrewapi.harrison-martin.com)
 */
export const API_URL = import.meta.env.VITE_API_URL || '';
