
import { toast } from 'sonner';

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

// Fetch historical data from Indian API
const fetchHistoricalData = async (ticker: string, period: string = '3yr'): Promise<StockDataPoint[]> => {
  try {
    const response = await fetch(`https://dev.indianapi.in/historical_data?stock_name=${ticker}&period=${period}&filter=price`);
    
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
    throw error;
  }
};

// Fetch stock details from Indian API
const fetchStockDetails = async (ticker: string): Promise<IndianAPIStockDataResponse> => {
  try {
    const response = await fetch(`https://dev.indianapi.in/get_stock_data?stock_name=${ticker}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching stock details:', error);
    throw error;
  }
};

export const fetchStockData = async (ticker: string): Promise<StockData> => {
  try {
    // Simulate API call for development
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For a real implementation, fetch both historical and stock data
    // const [historicalData, stockDetails] = await Promise.all([
    //   fetchHistoricalData(ticker),
    //   fetchStockDetails(ticker)
    // ]);
    
    // Using mock data for development
    const stockData: StockData = {
      ticker,
      companyName: ticker === 'TCS' ? 'Tata Consultancy Services' : 
                   ticker === 'INFY' ? 'Infosys Limited' : 
                   ticker === 'RELIANCE' ? 'Reliance Industries' : `${ticker} Ltd.`,
      price: ticker === 'TCS' ? 3246.60 : 
             ticker === 'INFY' ? 1523.45 : 
             ticker === 'RELIANCE' ? 2854.30 : Math.random() * 5000 + 500,
      change: (Math.random() * 50 - 25),
      changePercent: (Math.random() * 4 - 2),
      currency: '₹',
      marketStatus: 'open',
      lastUpdated: '2 min ago',
      stats: {
        open: ticker === 'TCS' ? 3260.00 : Math.random() * 5000 + 500,
        high: ticker === 'TCS' ? 3290.75 : Math.random() * 5000 + 550,
        low: ticker === 'TCS' ? 3242.20 : Math.random() * 5000 + 450,
        volume: ticker === 'TCS' ? 3121401 : Math.floor(Math.random() * 10000000),
        avgVolume: ticker === 'TCS' ? 3500000 : Math.floor(Math.random() * 8000000),
        marketCap: ticker === 'TCS' ? '₹11,91,635Cr' : `₹${Math.floor(Math.random() * 1000000)}Cr`,
        pe: ticker === 'TCS' ? 24.44 : Math.random() * 40 + 10,
        dividend: ticker === 'TCS' ? '2.22%' : `${(Math.random() * 4).toFixed(2)}%`,
        bookValue: ticker === 'TCS' ? 279.87 : Math.random() * 500 + 100,
        debtToEquity: ticker === 'TCS' ? 0.089 : Math.random() * 0.5,
        roe: ticker === 'TCS' ? 46.74 : Math.random() * 30 + 5
      },
      stockData: generateMockIndianStockData(ticker, 30),
    };
    
    return stockData;
  } catch (error) {
    console.error('Error in fetchStockData:', error);
    toast.error(`Failed to fetch data for ${ticker}`);
    throw error;
  }
};

// Helper to generate mock stock data with Indian market characteristics
const generateMockIndianStockData = (ticker: string, days: number): StockDataPoint[] => {
  const data: StockDataPoint[] = [];
  const today = new Date();
  
  // Set starting price based on ticker
  let price = ticker === 'TCS' ? 3250 : 
              ticker === 'INFY' ? 1500 : 
              ticker === 'RELIANCE' ? 2800 : 
              Math.random() * 3000 + 500;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    
    // Skip weekends (Saturday and Sunday)
    if (date.getDay() === 0 || date.getDay() === 6) {
      continue;
    }
    
    const volatility = 0.02;
    const changePercent = (Math.random() - 0.5) * volatility;
    
    const open = price * (1 + (Math.random() - 0.5) * 0.01);
    const close = open * (1 + changePercent);
    const high = Math.max(open, close) * (1 + Math.random() * 0.008);
    const low = Math.min(open, close) * (1 - Math.random() * 0.008);
    const volume = Math.floor(Math.random() * 5000000) + 1000000;
    
    data.push({
      date: date.toISOString().split('T')[0],
      open,
      high,
      low,
      close,
      volume
    });
    
    price = close;
  }
  
  return data;
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

export const getAIAnalysis = async (ticker: string) => {
  // In a real app this would call the OpenAI API
  // For now just simulate a delay
  toast.info("AI analysis in progress...");
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Success message would be shown by the component that called this
  return { success: true };
};
