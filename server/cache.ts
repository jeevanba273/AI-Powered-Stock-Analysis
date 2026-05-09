interface CacheEntry {
  data: string;
  contentType: string;
  status: number;
  expiresAt: number;
}

const store = new Map<string, CacheEntry>();
const DEFAULT_TTL = 60 * 60 * 1000; // 1 hour

export function getCached(url: string): CacheEntry | null {
  const entry = store.get(url);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(url);
    return null;
  }
  return entry;
}

export function setCache(url: string, data: string, contentType: string, status: number): void {
  if (status < 200 || status >= 300) return;
  store.set(url, { data, contentType, status, expiresAt: Date.now() + DEFAULT_TTL });
}

export function clearAllCache(): number {
  const count = store.size;
  store.clear();
  return count;
}

export function cacheStats(): { entries: number; size: string } {
  let bytes = 0;
  for (const entry of store.values()) bytes += entry.data.length;
  return { entries: store.size, size: (bytes / 1024).toFixed(1) + 'KB' };
}
