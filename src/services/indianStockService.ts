import { toast } from 'sonner';
import { analyzeNewsSentiment } from './aiService';
import { INDIAN_API_KEY, OPENAI_API_KEY } from '@/config/apiKeys';

// Server configuration — dev server is primary, normal server is fallback
const PRIMARY_BASE = 'https://dev.indianapi.in';
const FALLBACK_BASE = 'https://stock.indianapi.in';

export { INDIAN_API_KEY, OPENAI_API_KEY };

export interface StockDataPoint {
  date: string;
  open?: number;
  high?: number;
  low?: number;
  close: number;
  volume?: number;
}

export interface StockData {
  ticker: string;
  companyName: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  marketStatus: 'open' | 'closed' | 'pre-market' | 'after-hours';
  lastUpdated: string;
  stats: {
    open: number;
    high: number;
    low: number;
    volume: number;
    avgVolume?: number;
    marketCap: string;
    pe: number;
    dividend: string;
    bookValue?: number;
    debtToEquity?: number;
    roe?: number;
    [key: string]: any;
  };
  stockData: StockDataPoint[];
  indicators?: {
    sma?: number[];
  };
  newsSentiment?: {
    overall: string;
    positivePercentage: number;
    neutralPercentage: number;
    negativePercentage: number;
  };
  rawStockDetails?: any;
  newsData?: any[];
}

export interface MarketIndex {
  name: string;
  price: string;
  percentChange: string;
  netChange: string;
  tickerId: string;
  exchangeType: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const API_TIMEOUT = 10000;

const apiHeaders = () => ({
  'X-API-Key': INDIAN_API_KEY,
  'Content-Type': 'application/json'
});

const isAuthError = (error: any): boolean =>
  error?.message?.includes('API authentication failed');

const fetchWithTimeout = (url: string, options: RequestInit = {}): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
};

const handleResponse = async (response: Response, context: string): Promise<any> => {
  if (response.status === 403) {
    throw new Error('API authentication failed (Error 403): Invalid or expired API key');
  }
  if (response.status >= 500) {
    throw new Error(`[${context}] Server error: ${response.status}`);
  }
  if (!response.ok) {
    throw new Error(`[${context}] API error: ${response.status}`);
  }
  return response.json();
};

// ---------------------------------------------------------------------------
// Live Stock Price
// Primary:  POST /nse_stock_batch_live_price (dev)
// Fallback: GET  /stock?name=TICKER (normal — degraded)
// ---------------------------------------------------------------------------
const fetchLiveStockPrice = async (ticker: string): Promise<any> => {
  const headers = apiHeaders();
  const t0 = performance.now();

  try {
    const response = await fetchWithTimeout(`${PRIMARY_BASE}/nse_stock_batch_live_price`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ stock_symbols: [ticker] })
    });
    const data = await handleResponse(response, `LivePrice:${ticker}`);
    if (data?.[ticker]) {
      console.log(`[LivePrice] ${ticker} OK (${Math.round(performance.now() - t0)}ms)`);
      return data[ticker];
    }
    throw new Error(`[LivePrice] ${ticker}: empty response`);
  } catch (error: any) {
    if (isAuthError(error)) throw error;

    console.warn(`[LivePrice] ${ticker} primary failed (${Math.round(performance.now() - t0)}ms): ${error.message}`);
    const ft0 = performance.now();
    try {
      const response = await fetchWithTimeout(`${FALLBACK_BASE}/stock?name=${ticker}`, { headers });
      const data = await handleResponse(response, `LivePrice:${ticker}:fallback`);
      const price = parseFloat(data.currentPrice?.NSE) || parseFloat(data.currentPrice?.BSE) || 0;
      console.log(`[LivePrice] ${ticker} fallback OK (${Math.round(performance.now() - ft0)}ms)`);
      return {
        ltp: price, open: price, high: price, low: price, close: price,
        volume: 0, day_change: 0, day_change_percent: data.percentChange || 0
      };
    } catch (fallbackError: any) {
      console.error(`[LivePrice] ${ticker} fallback failed: ${fallbackError.message}`);
      throw error;
    }
  }
};

// ---------------------------------------------------------------------------
// Historical Data — 1yr only, trimmed to {date, close, volume}
// Primary:  GET /historical_data (dev)
// Fallback: GET /historical_data (normal — same endpoint)
// ---------------------------------------------------------------------------
const fetchHistoricalData = async (ticker: string): Promise<StockDataPoint[]> => {
  const headers = apiHeaders();
  const path = `/historical_data?stock_name=${ticker}&period=1yr&filter=price`;
  const t0 = performance.now();

  const parse = (data: any): StockDataPoint[] => {
    const prices = data.datasets?.find((d: any) => d.metric === 'Price')?.values || [];
    const volumes = data.datasets?.find((d: any) => d.metric === 'Volume')?.values || [];
    const volMap = new Map(volumes.map((v: any) => [v[0], v[1] as number]));

    return prices.map((item: any) => ({
      date: item[0] as string,
      close: parseFloat(item[1] as string),
      volume: volMap.get(item[0]) || undefined
    }));
  };

  try {
    const response = await fetchWithTimeout(`${PRIMARY_BASE}${path}`, { headers });
    const data = await handleResponse(response, `Historical:${ticker}`);
    const result = parse(data);
    console.log(`[Historical] ${ticker} OK — ${result.length} points (${Math.round(performance.now() - t0)}ms)`);
    return result;
  } catch (error: any) {
    if (isAuthError(error)) throw error;

    console.warn(`[Historical] ${ticker} primary failed (${Math.round(performance.now() - t0)}ms): ${error.message}`);
    const ft0 = performance.now();
    try {
      const response = await fetchWithTimeout(`${FALLBACK_BASE}${path}`, { headers });
      const data = await handleResponse(response, `Historical:${ticker}:fallback`);
      const result = parse(data);
      console.log(`[Historical] ${ticker} fallback OK — ${result.length} points (${Math.round(performance.now() - ft0)}ms)`);
      return result;
    } catch (fallbackError: any) {
      console.error(`[Historical] ${ticker} fallback failed: ${fallbackError.message}`);
      throw error;
    }
  }
};

// ---------------------------------------------------------------------------
// Stock Details (fundamentals, financials, company info)
// Primary:  GET /get_stock_data (dev — rich response)
// Fallback: GET /stock?name= (normal — transform to match)
// ---------------------------------------------------------------------------
const fetchStockDetails = async (ticker: string): Promise<Record<string, any>> => {
  const headers = apiHeaders();
  const t0 = performance.now();

  try {
    const response = await fetchWithTimeout(`${PRIMARY_BASE}/get_stock_data?stock_name=${ticker}`, { headers });
    const data = await handleResponse(response, `Details:${ticker}`);
    console.log(`[Details] ${ticker} OK (${Math.round(performance.now() - t0)}ms)`);
    return data;
  } catch (error: any) {
    if (isAuthError(error)) throw error;

    console.warn(`[Details] ${ticker} primary failed (${Math.round(performance.now() - t0)}ms): ${error.message}`);
    const ft0 = performance.now();
    try {
      const response = await fetchWithTimeout(`${FALLBACK_BASE}/stock?name=${ticker}`, { headers });
      const data = await handleResponse(response, `Details:${ticker}:fallback`);

      const findMetric = (category: any[], key: string): number => {
        if (!Array.isArray(category)) return 0;
        const item = category.find((m: any) => m.key?.toLowerCase().includes(key.toLowerCase()));
        return item ? parseFloat(item.value) || 0 : 0;
      };

      const valuation = data.keyMetrics?.valuation || [];
      const pershare = data.keyMetrics?.persharedata || [];
      const financial = data.keyMetrics?.financialstrength || [];
      const mgmt = data.keyMetrics?.mgmtEffectiveness || [];

      console.log(`[Details] ${ticker} fallback OK (${Math.round(performance.now() - ft0)}ms)`);
      return {
        name: data.companyName || `${ticker} Ltd.`,
        company_summary: data.companyProfile?.companyDescription || '',
        industry: data.industry || '',
        stats: {
          peRatio: findMetric(valuation, 'pPerEExcludingExtraordinaryItemsMostRecentFiscalYear'),
          divYield: findMetric(valuation, 'currentDividendYield'),
          marketCap: 0,
          bookValue: findMetric(pershare, 'bookValuePerShareMostRecentQuarter'),
          debtToEquity: findMetric(financial, 'totalDebtPerTotalEquityMostRecentQuarter'),
          roe: findMetric(mgmt, 'returnOnAverageEquity'),
          cappedType: ''
        },
        fundamentals: [],
        financials: data.financials || [],
        price_data: {
          nse: { yearHighPrice: data.yearHigh || 0, yearLowPrice: data.yearLow || 0 },
          bse: { yearHighPrice: data.yearHigh || 0, yearLowPrice: data.yearLow || 0 }
        }
      };
    } catch (fallbackError: any) {
      console.error(`[Details] ${ticker} fallback failed: ${fallbackError.message}`);
      throw error;
    }
  }
};

// ---------------------------------------------------------------------------
// Company News — only fetched when OpenAI key is available
// Primary:  GET /company_news (dev only)
// Fallback: none — returns empty
// ---------------------------------------------------------------------------
const fetchCompanyNews = async (ticker: string): Promise<any[]> => {
  if (!OPENAI_API_KEY) {
    console.log(`[News] ${ticker} skipped — no OpenAI key for sentiment analysis`);
    return [];
  }

  const headers = apiHeaders();
  const t0 = performance.now();

  try {
    const response = await fetchWithTimeout(`${PRIMARY_BASE}/company_news?stock_name=${ticker}`, { headers });
    const data = await handleResponse(response, `News:${ticker}`);
    const articles = data || [];
    console.log(`[News] ${ticker} OK — ${articles.length} articles (${Math.round(performance.now() - t0)}ms)`);
    return articles;
  } catch (error: any) {
    console.warn(`[News] ${ticker} failed (${Math.round(performance.now() - t0)}ms): ${error.message}`);
    return [];
  }
};

// ---------------------------------------------------------------------------
// Market status
// ---------------------------------------------------------------------------
const isMarketOpenInIST = (): boolean => {
  const now = new Date();
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const dayOfWeek = istTime.getDay();
  const currentTimeInMinutes = istTime.getHours() * 60 + istTime.getMinutes();
  return dayOfWeek >= 1 && dayOfWeek <= 5 && currentTimeInMinutes >= 555 && currentTimeInMinutes <= 930;
};

// ---------------------------------------------------------------------------
// Main data fetch — all calls parallel, no wasted work
// ---------------------------------------------------------------------------
export const fetchStockData = async (ticker: string): Promise<StockData> => {
  const t0 = performance.now();
  toast.loading(`Fetching data for ${ticker}...`, { id: "fetch-stock" });

  try {
    // All 4 calls fire in parallel
    const [liveResult, historyResult, detailsResult, newsResult] = await Promise.allSettled([
      fetchLiveStockPrice(ticker),
      fetchHistoricalData(ticker),
      fetchStockDetails(ticker),
      fetchCompanyNews(ticker)
    ]);

    // Live price is mandatory — can't show anything without it
    if (liveResult.status === 'rejected') {
      throw liveResult.reason;
    }
    const liveStockData = liveResult.value;

    // Historical & details degrade gracefully
    const historicalData = historyResult.status === 'fulfilled' ? historyResult.value : [];
    if (historyResult.status === 'rejected') {
      console.error(`[fetchStockData] Historical data unavailable for ${ticker}: ${historyResult.reason?.message}`);
    }

    const stockDetails = detailsResult.status === 'fulfilled' ? detailsResult.value : {};
    if (detailsResult.status === 'rejected') {
      console.error(`[fetchStockData] Stock details unavailable for ${ticker}: ${detailsResult.reason?.message}`);
    }

    const companyNews = newsResult.status === 'fulfilled' ? newsResult.value : [];

    // Sentiment — fire and forget, don't block the UI
    let newsSentiment: StockData['newsSentiment'] | undefined;
    if (companyNews.length > 0 && OPENAI_API_KEY) {
      analyzeNewsSentiment(ticker, companyNews)
        .then(sentiment => {
          console.log(`[Sentiment] ${ticker} OK:`, sentiment.overall);
        })
        .catch(err => {
          console.warn(`[Sentiment] ${ticker} failed: ${err.message}`);
        });
    }

    const totalMs = Math.round(performance.now() - t0);
    console.log(`[fetchStockData] ${ticker} complete in ${totalMs}ms — history:${historicalData.length}pts details:${detailsResult.status} news:${companyNews.length}`);
    toast.success(`Data loaded for ${ticker}`, { id: "fetch-stock" });

    const pe = typeof stockDetails.stats?.peRatio === 'number' ? stockDetails.stats.peRatio : 0;
    const dividend = typeof stockDetails.stats?.divYield === 'number'
      ? `${stockDetails.stats.divYield}%` : '0%';
    const marketCap = typeof stockDetails.stats?.marketCap === 'number'
      ? `₹${stockDetails.stats.marketCap.toFixed(2)}Cr` : '₹0Cr';

    return {
      ticker,
      companyName: stockDetails.name || `${ticker} Ltd.`,
      price: liveStockData.ltp,
      change: liveStockData.day_change,
      changePercent: liveStockData.day_change_percent,
      currency: '₹',
      marketStatus: isMarketOpenInIST() ? 'open' : 'closed',
      lastUpdated: new Date().toISOString(),
      stats: {
        open: liveStockData.open,
        high: liveStockData.high,
        low: liveStockData.low,
        volume: liveStockData.volume,
        avgVolume: liveStockData.volume,
        marketCap,
        pe,
        dividend,
        bookValue: typeof stockDetails.stats?.bookValue === 'number' ? stockDetails.stats.bookValue : 0,
        debtToEquity: typeof stockDetails.stats?.debtToEquity === 'number' ? stockDetails.stats.debtToEquity : 0,
        roe: typeof stockDetails.stats?.roe === 'number' ? stockDetails.stats.roe : 0
      },
      stockData: historicalData,
      newsSentiment,
      rawStockDetails: stockDetails,
      newsData: companyNews
    };
  } catch (error: any) {
    const totalMs = Math.round(performance.now() - t0);
    console.error(`[fetchStockData] ${ticker} FAILED in ${totalMs}ms: ${error.message}`);
    toast.error(`Failed to fetch data for ${ticker}: ${error.message}`, { id: "fetch-stock" });
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Market Indices (dev-only, no fallback)
// ---------------------------------------------------------------------------
export const fetchMarketIndices = async (): Promise<MarketIndex[]> => {
  const headers = apiHeaders();
  const t0 = performance.now();

  try {
    const targetIndices = ["NIFTY 50", "NIFTY Bank", "India VIX"];
    const [popularRes, sectoralRes] = await Promise.all([
      fetchWithTimeout(`${PRIMARY_BASE}/indices?exchange=NSE&index_type=POPULAR`, { headers }),
      fetchWithTimeout(`${PRIMARY_BASE}/indices?exchange=NSE&index_type=SECTOR`, { headers })
    ]);

    let indices: MarketIndex[] = [];

    if (popularRes.ok) {
      const data = await popularRes.json();
      indices = indices.concat(data.indices.filter((i: MarketIndex) => targetIndices.includes(i.name)));
    }
    if (sectoralRes.ok) {
      const data = await sectoralRes.json();
      indices = indices.concat(data.indices.filter((i: MarketIndex) => targetIndices.includes(i.name)));
    }

    console.log(`[Indices] OK — ${indices.length} indices (${Math.round(performance.now() - t0)}ms)`);
    if (indices.length === 0) throw new Error("No indices data found");
    return indices;
  } catch (error) {
    console.error(`[Indices] FAILED (${Math.round(performance.now() - t0)}ms):`, error);
    throw error;
  }
};

export const popularIndianStocks = [
  { ticker: 'TCS', name: 'Tata Consultancy Services' },
  { ticker: 'RELIANCE', name: 'Reliance Industries' },
  { ticker: 'INFY', name: 'Infosys Limited' },
  { ticker: 'HDFCBANK', name: 'HDFC Bank' },
  { ticker: 'ICICIBANK', name: 'ICICI Bank' },
  { ticker: 'SBIN', name: 'State Bank of India' },
  { ticker: 'TATAMOTORS', name: 'Tata Motors' },
  { ticker: 'BHARTIARTL', name: 'Bharti Airtel' },
];
