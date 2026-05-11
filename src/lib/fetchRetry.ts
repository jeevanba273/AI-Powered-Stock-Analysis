export async function fetchRetry(
  url: string,
  options: RequestInit = {},
  retries = 1,
  delayMs = 1000
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok || attempt === retries) return res;
      if (res.status >= 500) {
        console.warn(`[fetchRetry] ${url.slice(0, 60)} → ${res.status}, retry ${attempt + 1}/${retries}`);
        await new Promise(r => setTimeout(r, delayMs));
        continue;
      }
      return res;
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`[fetchRetry] ${url.slice(0, 60)} → network error, retry ${attempt + 1}/${retries}`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  return fetch(url, options);
}

export async function fetchJsonRetry(url: string, options: RequestInit = {}): Promise<any> {
  const res = await fetchRetry(url, options);
  if (!res.ok) return null;
  return res.json();
}
