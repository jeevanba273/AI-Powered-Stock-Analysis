
import { toast } from 'sonner';

// API Configuration with real API keys
export const INDIAN_API_KEY = "sk-live-ABJDNr3hqHXiB8PKvxgWwzUU123KyDyIGCq6qfW7";
export const OPENAI_API_KEY = "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";

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
    [key: string]: any;
  };
  stockData: StockDataPoint[];
  indicators?: {
    sma?: number[];
    rsi?: number[];
    macd?: { macd: number[]; signal: number[]; histogram: number[] };
  };
}

interface IndianAPIHistoricalResponse {
  datasets: {
    metric: string;
    label: string;
    values: Array<[string, string | number] | [string, number, { delivery: number | null }]>;
    meta: Record<string, any>;
  }[];
}

interface IndianAPIStockDataResponse {
  name: string;
  company_summary: string;
  industry: string;
  price_data: {
    nse: { yearLowPrice: number; yearHighPrice: number };
    bse: { yearLowPrice: number; yearHighPrice: number };
  };
  stats: Record<string, number | string>;
  fundamentals: Array<{ name: string; shortName: string; value: string }>;
  financials: Array<{
    title: string;
    yearly?: Record<string, number>;
    quarterly?: Record<string, number>;
  }>;
  [key: string]: any;
}

// Real API call to fetch historical data from Indian API
const fetchHistoricalData = async (ticker: string, period: string = '3yr'): Promise<StockDataPoint[]> => {
  try {
    const url = `https://dev.indianapi.in/historical_data?stock_name=${ticker}&period=${period}&filter=price`;
    
    const headers = {
      'Authorization': `Bearer ${INDIAN_API_KEY}`,
      'Content-Type': 'application/json'
    };
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data: IndianAPIHistoricalResponse = await response.json();
    
    // Extract price data
    const priceData = data.datasets.find(dataset => dataset.metric === 'Price')?.values || [];
    const volumeData = data.datasets.find(dataset => dataset.metric === 'Volume')?.values || [];
    
    // Map to our StockDataPoint format
    return priceData.map((item, index) => {
      const date = item[0] as string;
      const close = parseFloat(item[1] as string);
      
      // Find corresponding volume data if available
      const volumeEntry = volumeData.find(v => v[0] === date);
      const volume = volumeEntry ? volumeEntry[1] as number : undefined;
      
      return {
        date,
        close,
        volume
      };
    });
  } catch (error) {
    console.error('Error fetching historical data:', error);
    toast.error('Failed to fetch historical data');
    throw error;
  }
};

// Real API call to fetch stock details from Indian API
const fetchStockDetails = async (ticker: string): Promise<IndianAPIStockDataResponse> => {
  try {
    const url = `https://dev.indianapi.in/get_stock_data?stock_name=${ticker}`;
    
    const headers = {
      'Authorization': `Bearer ${INDIAN_API_KEY}`,
      'Content-Type': 'application/json'
    };
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching stock details:', error);
    toast.error('Failed to fetch stock details');
    throw error;
  }
};

export const fetchStockData = async (ticker: string): Promise<StockData> => {
  try {
    toast.loading(`Fetching data for ${ticker}...`, { id: "fetch-stock" });
    
    // Fetch both historical and stock data
    const [historicalData, stockDetails] = await Promise.all([
      fetchHistoricalData(ticker),
      fetchStockDetails(ticker)
    ]);
    
    toast.dismiss("fetch-stock");
    toast.success(`Data loaded for ${ticker}`);
    
    // Get latest price and calculate change
    const latestPrice = historicalData.length > 0 ? historicalData[historicalData.length - 1].close : 0;
    const previousPrice = historicalData.length > 1 ? historicalData[historicalData.length - 2].close : latestPrice;
    const change = latestPrice - previousPrice;
    const changePercent = (change / previousPrice) * 100;
    
    // Extract relevant statistics
    const pe = typeof stockDetails.stats.peRatio === 'number' ? stockDetails.stats.peRatio : 0;
    const dividend = typeof stockDetails.stats.divYield === 'number' 
      ? `${stockDetails.stats.divYield}%` 
      : '0%';
    const marketCap = typeof stockDetails.stats.marketCap === 'number'
      ? `₹${(stockDetails.stats.marketCap).toFixed(2)}Cr`
      : '₹0Cr';
      
    // Get volume from historical data
    const volume = historicalData.length > 0 && historicalData[historicalData.length - 1].volume 
      ? historicalData[historicalData.length - 1].volume as number 
      : 0;
    
    // Create stock data object
    const stockData: StockData = {
      ticker,
      companyName: stockDetails.name || `${ticker} Ltd.`,
      price: latestPrice,
      change,
      changePercent,
      currency: '₹',
      marketStatus: 'open', // Assume market is open by default
      lastUpdated: new Date().toLocaleTimeString(),
      stats: {
        open: historicalData.length > 0 ? latestPrice : 0, // We don't have open price in the data
        high: stockDetails.price_data?.nse?.yearHighPrice || 0,
        low: stockDetails.price_data?.nse?.yearLowPrice || 0,
        volume,
        avgVolume: volume, // We don't have average volume in the data
        marketCap,
        pe,
        dividend,
        bookValue: typeof stockDetails.stats.bookValue === 'number' ? stockDetails.stats.bookValue : 0,
        debtToEquity: typeof stockDetails.stats.debtToEquity === 'number' ? stockDetails.stats.debtToEquity : 0,
        roe: typeof stockDetails.stats.roe === 'number' ? stockDetails.stats.roe : 0
      },
      stockData: historicalData,
    };
    
    return stockData;
  } catch (error) {
    console.error('Error in fetchStockData:', error);
    toast.dismiss("fetch-stock");
    toast.error(`Failed to fetch data for ${ticker}`);
    throw error;
  }
};

// List of popular Indian stocks
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
