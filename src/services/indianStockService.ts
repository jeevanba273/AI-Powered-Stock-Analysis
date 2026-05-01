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

const apiHeaders = () => ({
  'X-API-Key': INDIAN_API_KEY,
  'Content-Type': 'application/json'
});

const isAuthError = (error: any): boolean =>
  error?.message?.includes('API authentication failed');

// ---------------------------------------------------------------------------
// Live Stock Price
// Primary:  POST /nse_stock_batch_live_price (dev only)
// Fallback: GET  /stock?name=TICKER (normal server — degraded OHLCV)
// ---------------------------------------------------------------------------
const fetchLiveStockPrice = async (ticker: string): Promise<any> => {
  const headers = apiHeaders();

  try {
    console.log(`[Primary] Fetching live price for ${ticker}...`);
    const response = await fetch(`${PRIMARY_BASE}/nse_stock_batch_live_price`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ stock_symbols: [ticker] })
    });

    if (response.status === 403) {
      throw new Error('API authentication failed (Error 403): Invalid or expired API key');
    }
    if (response.status >= 500) {
      throw new Error(`Primary server error: ${response.status}`);
    }
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API error: ${response.status} - ${text}`);
    }

    const data = await response.json();
    if (data?.[ticker]) return data[ticker];
    throw new Error('Invalid response format from API');
  } catch (error: any) {
    if (isAuthError(error)) throw error;

    console.warn(`[Fallback] Live price for ${ticker}: trying fallback server...`, error.message);
    try {
      const response = await fetch(`${FALLBACK_BASE}/stock?name=${ticker}`, { headers });
      if (!response.ok) throw new Error(`Fallback API error: ${response.status}`);

      const data = await response.json();
      const price = parseFloat(data.currentPrice?.NSE) || parseFloat(data.currentPrice?.BSE) || 0;
      return {
        ltp: price,
        open: price,
        high: price,
        low: price,
        close: price,
        volume: 0,
        day_change: 0,
        day_change_percent: data.percentChange || 0
      };
    } catch (fallbackError: any) {
      console.error('[Fallback] Live price: fallback also failed:', fallbackError.message);
      throw error;
    }
  }
};

// ---------------------------------------------------------------------------
// Historical Data
// Primary:  GET /historical_data (dev server)
// Fallback: GET /historical_data (normal server — same endpoint, both support it)
// ---------------------------------------------------------------------------
const fetchHistoricalData = async (ticker: string, period: string = '3yr'): Promise<StockDataPoint[]> => {
  const headers = apiHeaders();
  const path = `/historical_data?stock_name=${ticker}&period=${period}&filter=price`;

  const parseHistoricalResponse = (data: any): StockDataPoint[] => {
    const priceData = data.datasets?.find((d: any) => d.metric === 'Price')?.values || [];
    const volumeData = data.datasets?.find((d: any) => d.metric === 'Volume')?.values || [];

    return priceData.map((item: any) => {
      const date = item[0] as string;
      const close = parseFloat(item[1] as string);
      const volumeEntry = volumeData.find((v: any) => v[0] === date);
      const volume = volumeEntry ? volumeEntry[1] as number : undefined;
      return { date, close, volume };
    });
  };

  try {
    console.log(`[Primary] Fetching historical data for ${ticker}...`);
    const response = await fetch(`${PRIMARY_BASE}${path}`, { headers });

    if (response.status === 403) {
      throw new Error('API authentication failed (Error 403): Invalid or expired API key');
    }
    if (response.status >= 500) {
      throw new Error(`Primary server error: ${response.status}`);
    }
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API error: ${response.status} - ${text}`);
    }

    return parseHistoricalResponse(await response.json());
  } catch (error: any) {
    if (isAuthError(error)) throw error;

    console.warn(`[Fallback] Historical data for ${ticker}: trying fallback server...`, error.message);
    try {
      const response = await fetch(`${FALLBACK_BASE}${path}`, { headers });
      if (!response.ok) throw new Error(`Fallback API error: ${response.status}`);
      return parseHistoricalResponse(await response.json());
    } catch (fallbackError: any) {
      console.error('[Fallback] Historical data: fallback also failed:', fallbackError.message);
      throw error;
    }
  }
};

// ---------------------------------------------------------------------------
// Stock Details (fundamentals, financials, company info)
// Primary:  GET /get_stock_data?stock_name= (dev server — rich response)
// Fallback: GET /stock?name= (normal server — transform to match expected shape)
// ---------------------------------------------------------------------------
const fetchStockDetails = async (ticker: string): Promise<Record<string, any>> => {
  const headers = apiHeaders();

  try {
    console.log(`[Primary] Fetching stock details for ${ticker}...`);
    const response = await fetch(`${PRIMARY_BASE}/get_stock_data?stock_name=${ticker}`, { headers });

    if (response.status === 403) {
      throw new Error('API authentication failed (Error 403): Invalid or expired API key');
    }
    if (response.status >= 500) {
      throw new Error(`Primary server error: ${response.status}`);
    }
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API error: ${response.status} - ${text}`);
    }

    return await response.json();
  } catch (error: any) {
    if (isAuthError(error)) throw error;

    console.warn(`[Fallback] Stock details for ${ticker}: trying fallback server...`, error.message);
    try {
      const response = await fetch(`${FALLBACK_BASE}/stock?name=${ticker}`, { headers });
      if (!response.ok) throw new Error(`Fallback API error: ${response.status}`);

      const data = await response.json();

      // Helper: extract a value from fallback keyMetrics nested arrays
      const findMetric = (category: any[], key: string): number => {
        if (!Array.isArray(category)) return 0;
        const item = category.find((m: any) => m.key?.toLowerCase().includes(key.toLowerCase()));
        return item ? parseFloat(item.value) || 0 : 0;
      };

      const valuation = data.keyMetrics?.valuation || [];
      const pershare = data.keyMetrics?.persharedata || [];
      const financial = data.keyMetrics?.financialstrength || [];
      const mgmt = data.keyMetrics?.mgmtEffectiveness || [];

      // Transform /stock response to match the shape expected from /get_stock_data
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
          nse: {
            yearHighPrice: data.yearHigh || 0,
            yearLowPrice: data.yearLow || 0
          },
          bse: {
            yearHighPrice: data.yearHigh || 0,
            yearLowPrice: data.yearLow || 0
          }
        }
      };
    } catch (fallbackError: any) {
      console.error('[Fallback] Stock details: fallback also failed:', fallbackError.message);
      throw error;
    }
  }
};

// ---------------------------------------------------------------------------
// Company News
// Primary:  GET /company_news?stock_name= (dev only)
// Fallback: none — return empty array gracefully
// ---------------------------------------------------------------------------
const fetchCompanyNews = async (ticker: string): Promise<any[]> => {
  const headers = apiHeaders();

  try {
    console.log(`[Primary] Fetching news for ${ticker}...`);
    const response = await fetch(`${PRIMARY_BASE}/company_news?stock_name=${ticker}`, { headers });

    if (response.status === 403) {
      throw new Error('API authentication failed (Error 403): Invalid or expired API key');
    }
    if (response.status >= 500) {
      throw new Error(`Primary server error: ${response.status}`);
    }
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API error: ${response.status} - ${text}`);
    }

    const data = await response.json();
    return data || [];
  } catch (error: any) {
    if (isAuthError(error)) throw error;

    // /company_news is dev-only — no equivalent on fallback server
    console.warn(`[Fallback] Company news for ${ticker}: dev-only endpoint, returning empty.`, error.message);
    return [];
  }
};

const isMarketOpenInIST = (): boolean => {
  const now = new Date();
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const dayOfWeek = istTime.getDay();
  const hours = istTime.getHours();
  const minutes = istTime.getMinutes();
  const currentTimeInMinutes = hours * 60 + minutes;

  const marketOpenTime = 9 * 60 + 15;   // 9:15 AM
  const marketCloseTime = 15 * 60 + 30;  // 3:30 PM

  return (
    dayOfWeek >= 1 &&
    dayOfWeek <= 5 &&
    currentTimeInMinutes >= marketOpenTime &&
    currentTimeInMinutes <= marketCloseTime
  );
};

export const fetchStockData = async (ticker: string): Promise<StockData> => {
  try {
    toast.loading(`Fetching data for ${ticker}...`, { id: "fetch-stock" });

    try {
      const [liveStockData, historicalData, stockDetails, companyNews] = await Promise.all([
        fetchLiveStockPrice(ticker),
        fetchHistoricalData(ticker),
        fetchStockDetails(ticker),
        fetchCompanyNews(ticker)
      ]);

      let newsSentiment;
      if (companyNews && companyNews.length > 0) {
        newsSentiment = await analyzeNewsSentiment(ticker, companyNews);
      } else {
        console.log('No news data available for sentiment analysis');
      }

      toast.dismiss("fetch-stock");
      toast.success(`Data loaded for ${ticker}`);

      const latestPrice = liveStockData.ltp;
      const change = liveStockData.day_change;
      const changePercent = liveStockData.day_change_percent;
      const openPrice = liveStockData.open;
      const highPrice = liveStockData.high;
      const lowPrice = liveStockData.low;
      const volume = liveStockData.volume;

      const marketStatus = isMarketOpenInIST() ? 'open' : 'closed';
      const formattedDate = new Date().toISOString();

      const pe = typeof stockDetails.stats?.peRatio === 'number' ? stockDetails.stats.peRatio : 0;
      const dividend = typeof stockDetails.stats?.divYield === 'number'
        ? `${stockDetails.stats.divYield}%`
        : '0%';
      const marketCap = typeof stockDetails.stats?.marketCap === 'number'
        ? `₹${(stockDetails.stats.marketCap).toFixed(2)}Cr`
        : '₹0Cr';
      const bookValue = typeof stockDetails.stats?.bookValue === 'number' ? stockDetails.stats.bookValue : 0;
      const debtToEquity = typeof stockDetails.stats?.debtToEquity === 'number' ? stockDetails.stats.debtToEquity : 0;
      const roe = typeof stockDetails.stats?.roe === 'number' ? stockDetails.stats.roe : 0;

      const stockData: StockData = {
        ticker,
        companyName: stockDetails.name || `${ticker} Ltd.`,
        price: latestPrice,
        change,
        changePercent,
        currency: '₹',
        marketStatus,
        lastUpdated: formattedDate,
        stats: {
          open: openPrice,
          high: highPrice,
          low: lowPrice,
          volume,
          avgVolume: volume,
          marketCap,
          pe,
          dividend,
          bookValue,
          debtToEquity,
          roe
        },
        stockData: historicalData,
        newsSentiment,
        rawStockDetails: stockDetails,
        newsData: companyNews
      };

      return stockData;
    } catch (error: any) {
      console.error('Error in API data fetching:', error);

      if (error.message?.includes('API authentication failed')) {
        throw new Error('API authentication failed: The API key appears to be invalid or expired. Please check your API credentials.');
      }

      if (error.message?.includes('Network') || error.message?.includes('Failed to fetch')) {
        throw new Error('Network error: Unable to connect to the stock data API. Please check your internet connection and try again.');
      }

      throw error;
    }
  } catch (error: any) {
    console.error('Error in fetchStockData:', error);
    toast.dismiss("fetch-stock");
    toast.error(`Failed to fetch data for ${ticker}: ${error.message}`);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Market Indices
// Primary:  GET /indices (dev only)
// Fallback: none — dev-only endpoint
// ---------------------------------------------------------------------------
export const fetchMarketIndices = async (): Promise<MarketIndex[]> => {
  const headers = apiHeaders();

  try {
    console.log("[Primary] Fetching market indices...");
    const targetIndices = ["NIFTY 50", "NIFTY Bank", "India VIX"];
    let indices: MarketIndex[] = [];

    const popularResponse = await fetch(
      `${PRIMARY_BASE}/indices?exchange=NSE&index_type=POPULAR`,
      { headers }
    );

    if (popularResponse.ok) {
      const popularData = await popularResponse.json();
      indices = indices.concat(
        popularData.indices.filter((idx: MarketIndex) => targetIndices.includes(idx.name))
      );
    } else {
      console.error("Failed to fetch popular indices:", await popularResponse.text());
      throw new Error("Failed to fetch popular indices");
    }

    const sectoralResponse = await fetch(
      `${PRIMARY_BASE}/indices?exchange=NSE&index_type=SECTOR`,
      { headers }
    );

    if (sectoralResponse.ok) {
      const sectoralData = await sectoralResponse.json();
      indices = indices.concat(
        sectoralData.indices.filter((idx: MarketIndex) => targetIndices.includes(idx.name))
      );
    } else {
      console.error("Failed to fetch sectoral indices:", await sectoralResponse.text());
      throw new Error("Failed to fetch sectoral indices");
    }

    console.log("Fetched market indices:", indices);

    if (indices.length === 0) {
      throw new Error("No indices data found");
    }

    return indices;
  } catch (error) {
    // /indices is dev-only — no fallback equivalent
    console.error("Error fetching market indices (dev-only, no fallback):", error);
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
