import { Router, Request, Response } from 'express';

const router = Router();

const DEV_BASE = 'https://dev.indianapi.in';
const FALLBACK_BASE = 'https://stock.indianapi.in';
const API_KEY = process.env.INDIAN_API_KEY || process.env.VITE_INDIAN_API_KEY || '';

const doFetch = async (url: string, method: string, body: any): Promise<{ status: number; data: string; contentType: string }> => {
  const headers: Record<string, string> = {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
  };
  const options: RequestInit = { method, headers };
  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }
  const response = await fetch(url, options);
  const data = await response.text();
  return { status: response.status, data, contentType: response.headers.get('content-type') || 'application/json' };
};

const proxyRequest = async (baseUrl: string, path: string, query: string, method: string, body: any, res: Response) => {
  const url = `${baseUrl}${path}${query ? '?' + query : ''}`;
  const tag = baseUrl.includes('dev') ? 'DEV' : 'FALLBACK';
  const t0 = Date.now();

  try {
    let result = await doFetch(url, method, body);

    // Retry once on 500 (dev server has transient failures)
    if (result.status >= 500 && tag === 'DEV') {
      console.warn(`[Proxy:${tag}] ${method} ${path} → ${result.status}, retrying...`);
      await new Promise(r => setTimeout(r, 300));
      result = await doFetch(url, method, body);
    }

    const ms = Date.now() - t0;

    if (!result.status || result.status >= 400) {
      console.error(`[Proxy:${tag}] ${method} ${path}${query ? '?' + query : ''} → ${result.status} (${ms}ms)`);
      console.error(`[Proxy:${tag}] Response body: ${result.data.slice(0, 500)}`);
    } else {
      console.log(`[Proxy:${tag}] ${method} ${path}${query ? '?' + query.slice(0, 60) : ''} → ${result.status} (${ms}ms) [${result.data.length}B]`);
    }

    res.status(result.status);
    res.setHeader('Content-Type', result.contentType);
    res.send(result.data);
  } catch (error: any) {
    const ms = Date.now() - t0;
    console.error(`[Proxy:${tag}] ${method} ${path} → NETWORK ERROR (${ms}ms): ${error.message}`);
    res.status(502).json({ error: 'Proxy request failed', details: error.message });
  }
};

const buildQuery = (req: Request): string => {
  return new URLSearchParams(req.query as Record<string, string>).toString();
};

router.all('/dev/{*path}', async (req: Request, res: Response) => {
  const path = '/' + (req.params as any).path;
  await proxyRequest(DEV_BASE, path, buildQuery(req), req.method, req.body, res);
});

router.all('/fallback/{*path}', async (req: Request, res: Response) => {
  const path = '/' + (req.params as any).path;
  await proxyRequest(FALLBACK_BASE, path, buildQuery(req), req.method, req.body, res);
});

export default router;
