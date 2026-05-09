import { Router, Request, Response } from 'express';

const router = Router();

const DEV_BASE = 'https://dev.indianapi.in';
const FALLBACK_BASE = 'https://stock.indianapi.in';
const API_KEY = process.env.INDIAN_API_KEY || process.env.VITE_INDIAN_API_KEY || '';

const proxyRequest = async (baseUrl: string, path: string, query: string, method: string, body: any, res: Response) => {
  const url = `${baseUrl}${path}${query ? '?' + query : ''}`;
  const tag = baseUrl.includes('dev') ? 'DEV' : 'FALLBACK';
  const t0 = Date.now();

  const headers: Record<string, string> = {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
  };

  try {
    const options: RequestInit = { method, headers };
    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.text();
    const ms = Date.now() - t0;

    if (!response.ok) {
      console.error(`[Proxy:${tag}] ${method} ${path}${query ? '?' + query : ''} → ${response.status} (${ms}ms)`);
      console.error(`[Proxy:${tag}] Response body: ${data.slice(0, 500)}`);
      console.error(`[Proxy:${tag}] API key used: ${API_KEY ? API_KEY.slice(0, 12) + '...' : 'EMPTY'}`);
    } else {
      console.log(`[Proxy:${tag}] ${method} ${path}${query ? '?' + query.slice(0, 60) : ''} → ${response.status} (${ms}ms) [${data.length}B]`);
    }

    res.status(response.status);
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
    res.send(data);
  } catch (error: any) {
    const ms = Date.now() - t0;
    console.error(`[Proxy:${tag}] ${method} ${path} → NETWORK ERROR (${ms}ms): ${error.message}`);
    console.error(`[Proxy:${tag}] API key used: ${API_KEY ? API_KEY.slice(0, 12) + '...' : 'EMPTY'}`);
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
