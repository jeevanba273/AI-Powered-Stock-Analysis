import { Router, Request, Response } from 'express';
import { getCached, setCache } from '../cache.js';

const router = Router();

const API_KEY = (): string => process.env.INDIAN_API_KEY || process.env.VITE_INDIAN_API_KEY || '';
const DEV_BASE = 'https://dev.indianapi.in';

const apiFetch = async (path: string, method = 'GET', body?: unknown): Promise<any> => {
  try {
    const opts: any = {
      method,
      headers: { 'X-API-Key': API_KEY(), 'Content-Type': 'application/json' }
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${DEV_BASE}${path}`, opts);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

/**
 * Fetch with per-sub-request caching.
 * Each sub-call gets its own cache entry so repeated aggregate requests
 * reuse already-fetched pieces.
 */
const cachedApiFetch = async (path: string, method = 'GET', body?: unknown): Promise<any> => {
  const cacheKey = `stock-agg:${method}:${path}${body ? ':' + JSON.stringify(body) : ''}`;
  const hit = getCached(cacheKey);
  if (hit) return JSON.parse(hit.data);

  const data = await apiFetch(path, method, body);
  if (data !== null) {
    setCache(cacheKey, JSON.stringify(data), 'application/json', 200);
  }
  return data;
};

// GET /api/stock/:ticker — aggregate all stock data in one round-trip
router.get('/:ticker', async (req: Request, res: Response) => {
  const ticker = String(req.params.ticker);
  const t0 = Date.now();

  // Fetch ALL data in parallel — server-side, no CORS
  const [liveData, stockDetails, historicalData, companyNews, logoData] = await Promise.all([
    cachedApiFetch('/nse_stock_batch_live_price', 'POST', { stock_symbols: [ticker] }),
    cachedApiFetch(`/get_stock_data?stock_name=${encodeURIComponent(ticker)}`),
    cachedApiFetch(`/historical_data?stock_name=${encodeURIComponent(ticker)}&period=1yr&filter=price`),
    cachedApiFetch(`/company_news?stock_name=${encodeURIComponent(ticker)}`),
    cachedApiFetch(`/logo?stock_name=${encodeURIComponent(ticker)}`),
  ]);

  const ms = Date.now() - t0;
  console.log(`[Stock] ${ticker} aggregated in ${ms}ms`);

  res.json({
    live: liveData?.[ticker] || null,
    details: stockDetails || null,
    historical: historicalData || null,
    news: Array.isArray(companyNews) ? companyNews : [],
    logo: logoData?.base64_image || '',
  });
});

export default router;
