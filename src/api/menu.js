import { API_BASE } from '../config.js';

export async function fetchMenu(slug) {
  const url = `${API_BASE}/${encodeURIComponent(slug)}/menu`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch menu');
  const payload = await res.json();
  if (!payload || !payload.success) return [];
  return payload.data || [];
}
