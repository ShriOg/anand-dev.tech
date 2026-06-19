const cache = new Map<string, { data: any; expires: number }>();

export function cacheGet(key: string) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) { cache.delete(key); return null; }
  return entry.data;
}

export function cacheSet(key: string, data: any, ttlMs = 30000) {
  cache.set(key, { data, expires: Date.now() + ttlMs });
}

export function cacheDelete(key: string) { cache.delete(key); }
export function cacheDeletePrefix(prefix: string) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}
