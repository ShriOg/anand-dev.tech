export const API_BASE = 'https://api.menunova.me/api/restaurant';

export function getSlug() {
  // Prefer explicit ?slug= for local testing
  const qs = new URLSearchParams(location.search);
  if (qs.get('slug')) return qs.get('slug');

  const host = location.hostname; // e.g. foodbelly.menunova.me
  const parts = host.split('.');
  if (parts.length >= 3) return parts[0];
  // Fallback: if host is like foodbelly or localhost, try first part
  return parts[0] || 'demo';
}
