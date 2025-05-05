import { toast } from 'sonner';
import { analyzeNewsSentiment } from './aiService';

// API Configuration
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
  rawStockDetails?: any; // Raw stock details from API
  newsData?: any[]; // Raw news data
}

export interface MarketIndex {
  name: string;
  price: string;
  percentChange: string;
  netChange: string;
  tickerId: string;
  exchangeType: string;
}

// API call to fetch live stock price
const fetchLiveStockPrice = async (ticker: string): Promise<any> => {
  try {
    console.log(`Fetching live price data for ${ticker}...`);
    const url = 'https://dev.indianapi.in/nse_stock_batch_live_price';
    
    const payload = {
      stock_symbols: [ticker]
    };
    
    const headers = {
      'X-API-Key': INDIAN_API_KEY,
      'Content-Type': 'application/json'
    };
    
    console.log('Using API key with X-API-Key header');
    
    const response = await fetch(url, { 
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const text = await response.text();
      console.error(`API error: ${response.status} - ${text}`);
      
      if (response.status === 403) {
        throw new Error(`API authentication failed (Error 403): Invalid or expired API key`);
      }
      
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Live price data received for ${ticker}:`, data);
    
    if (data && data[ticker]) {
      return data[ticker];
    } else {
      throw new Error('Invalid response format from API');
    }
  } catch (error) {
    console.error('Error fetching live stock price:', error);
    throw error;
  }
};

// API call to fetch historical data
const fetchHistoricalData = async (ticker: string, period: string = '3yr'): Promise<StockDataPoint[]> => {
  try {
    console.log(`Fetching historical data for ${ticker}...`);
    const url = `https://dev.indianapi.in/historical_data?stock_name=${ticker}&period=${period}&filter=price`;
    
    const headers = {
      'X-API-Key': INDIAN_API_KEY,
      'Content-Type': 'application/json'
    };
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      const text = await response.text();
      console.error(`API error: ${response.status} - ${text}`);
      
      if (response.status === 403) {
        throw new Error(`API authentication failed (Error 403): Invalid or expired API key`);
      }
      
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Historical data received for ${ticker}`);
    
    const priceData = data.datasets.find((dataset: any) => dataset.metric === 'Price')?.values || [];
    const volumeData = data.datasets.find((dataset: any) => dataset.metric === 'Volume')?.values || [];
    
    return priceData.map((item: any, index: number) => {
      const date = item[0] as string;
      const close = parseFloat(item[1] as string);
      
      const volumeEntry = volumeData.find((v: any) => v[0] === date);
      const volume = volumeEntry ? volumeEntry[1] as number : undefined;
      
      return {
        date,
        close,
        volume
      };
    });
  } catch (error) {
    console.error('Error fetching historical data:', error);
    throw error;
  }
};

// API call to fetch stock details
const fetchStockDetails = async (ticker: string): Promise<Record<string, any>> => {
  try {
    console.log(`Fetching stock details for ${ticker}...`);
    const url = `https://dev.indianapi.in/get_stock_data?stock_name=${ticker}`;
    
    const headers = {
      'X-API-Key': INDIAN_API_KEY,
      'Content-Type': 'application/json'
    };
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      const text = await response.text();
      console.error(`API error: ${response.status} - ${text}`);
      
      if (response.status === 403) {
        throw new Error(`API authentication failed (Error 403): Invalid or expired API key`);
      }
      
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Stock details received for ${ticker}:`, data);
    return data;
  } catch (error) {
    console.error('Error fetching stock details:', error);
    throw error;
  }
};

// API call to fetch company news
const fetchCompanyNews = async (ticker: string): Promise<any[]> => {
  try {
    console.log(`Fetching news for ${ticker}...`);
    const url = `https://dev.indianapi.in/company_news?stock_name=${ticker}`;
    
    const headers = {
      'X-API-Key': INDIAN_API_KEY,
      'Content-Type': 'application/json'
    };
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      const text = await response.text();
      console.error(`API error: ${response.status} - ${text}`);
      
      if (response.status === 403) {
        throw new Error(`API authentication failed (Error 403): Invalid or expired API key`);
      }
      
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`News data received for ${ticker}:`, data);
    return data || [];
  } catch (error) {
    console.error('Error fetching company news:', error);
    throw error;
  }
};

const isMarketOpenInIST = (): boolean => {
  // Create a date object in IST
  const now = new Date();
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  
  // Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dayOfWeek = istTime.getDay();
  
  // Get hours and minutes in IST
  const hours = istTime.getHours();
  const minutes = istTime.getMinutes();
  const currentTimeInMinutes = hours * 60 + minutes;
  
  // Market opens at 9:15 AM (555 minutes) and closes at 3:30 PM (930 minutes)
  const marketOpenTime = 9 * 60 + 15;  // 9:15 AM in minutes
  const marketCloseTime = 15 * 60 + 30; // 3:30 PM in minutes
  
  // Check if it's a weekday (Monday-Friday) and within market hours
  return (
    dayOfWeek >= 1 && // Monday
    dayOfWeek <= 5 && // Friday
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
      
      const pe = typeof stockDetails.stats.peRatio === 'number' ? stockDetails.stats.peRatio : 0;
      const dividend = typeof stockDetails.stats.divYield === 'number' 
        ? `${stockDetails.stats.divYield}%` 
        : '0%';
      const marketCap = typeof stockDetails.stats.marketCap === 'number'
        ? `₹${(stockDetails.stats.marketCap).toFixed(2)}Cr`
        : '₹0Cr';
      const bookValue = typeof stockDetails.stats.bookValue === 'number' ? stockDetails.stats.bookValue : 0;
      const debtToEquity = typeof stockDetails.stats.debtToEquity === 'number' ? stockDetails.stats.debtToEquity : 0;
      const roe = typeof stockDetails.stats.roe === 'number' ? stockDetails.stats.roe : 0;
      
      const stockData: StockData = {
        ticker,
        companyName: stockDetails.name || `${ticker} Ltd.`,
        price: latestPrice,
        change,
        changePercent,
        currency: '₹',
        marketStatus,
        lastUpdated: new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }),
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
    } catch (error) {
      console.error('Error in API data fetching:', error);
      
      if (error.message && error.message.includes('API authentication failed')) {
        throw new Error('API authentication failed: The API key appears to be invalid or expired. Please check your API credentials.');
      }
      
      if (error.message && error.message.includes('Network') || error.message.includes('Failed to fetch')) {
        throw new Error('Network error: Unable to connect to the stock data API. Please check your internet connection and try again.');
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Error in fetchStockData:', error);
    toast.dismiss("fetch-stock");
    toast.error(`Failed to fetch data for ${ticker}: ${error.message}`);
    throw error;
  }
};

export const fetchMarketIndices = async (): Promise<MarketIndex[]> => {
  try {
    console.log("Fetching market indices data...");
    const targetIndices = ["NIFTY 50", "NIFTY Bank", "India VIX"];
    let indices: MarketIndex[] = [];
    
    console.log('Using X-API-Key header for indices');
    
    const popularUrl = "https://dev.indianapi.in/indices?exchange=NSE&index_type=POPULAR";
    
    const popularResponse = await fetch(popularUrl, {
      headers: {
        'X-API-Key': INDIAN_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (popularResponse.ok) {
      const popularData = await popularResponse.json();
      const popularIndices = popularData.indices.filter((index: MarketIndex) => 
        targetIndices.includes(index.name));
      indices = indices.concat(popularIndices);
    } else {
      console.error("Failed to fetch popular indices:", await popularResponse.text());
      throw new Error("Failed to fetch popular indices");
    }
    
    const sectoralUrl = "https://dev.indianapi.in/indices?exchange=NSE&index_type=SECTOR";
    
    const sectoralResponse = await fetch(sectoralUrl, {
      headers: {
        'X-API-Key': INDIAN_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (sectoralResponse.ok) {
      const sectoralData = await sectoralResponse.json();
      const sectoralIndices = sectoralData.indices.filter((index: MarketIndex) => 
        targetIndices.includes(index.name));
      indices = indices.concat(sectoralIndices);
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
    console.error("Error fetching market indices:", error);
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
