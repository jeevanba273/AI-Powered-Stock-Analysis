import { Router, Request, Response } from 'express';

const router = Router();

const DEV_BASE = 'https://dev.indianapi.in';
const FALLBACK_BASE = 'https://stock.indianapi.in';
const API_KEY = process.env.INDIAN_API_KEY || process.env.VITE_INDIAN_API_KEY || '';

const proxyRequest = async (baseUrl: string, path: string, query: string, method: string, body: any, res: Response) => {
  const url = `${baseUrl}${path}${query ? '?' + query : ''}`;
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

    res.status(response.status);
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
    res.send(data);
  } catch (error: any) {
    console.error(`[Proxy] ${method} ${url} failed: ${error.message}`);
    res.status(502).json({ error: 'Proxy request failed', details: error.message });
  }
};

const buildQuery = (req: Request): string => {
  const qs = new URLSearchParams(req.query as Record<string, string>).toString();
  return qs;
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
