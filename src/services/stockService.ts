// This would be a real API service in a production app
// For demo purposes, we're using mock data

import { toast } from 'sonner';

export interface StockDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
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
    avgVolume: number;
    marketCap: string;
    pe: number;
    dividend: string;
  };
  stockData: StockDataPoint[];
  indicators?: {
    sma?: number[];
    rsi?: number[];
    macd?: { macd: number[]; signal: number[]; histogram: number[] };
  };
}

// Helper to generate mock stock data
const generateMockStockData = (ticker: string, days: number): StockDataPoint[] => {
  const data: StockDataPoint[] = [];
  const today = new Date();
  let price = ticker === 'AAPL' ? 180 : ticker === 'MSFT' ? 400 : ticker === 'GOOG' ? 145 : 100;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    
    const volatility = 0.02;
    const changePercent = (Math.random() - 0.5) * volatility;
    
    const open = price * (1 + (Math.random() - 0.5) * 0.01);
    const close = open * (1 + changePercent);
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    const volume = Math.floor(Math.random() * 10000000) + 5000000;
    
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

// Mock stock data for each ticker
const mockStocks: Record<string, StockData> = {
  'AAPL': {
    ticker: 'AAPL',
    companyName: 'Apple Inc.',
    price: 181.56,
    change: 1.78,
    changePercent: 0.99,
    currency: 'USD',
    marketStatus: 'open',
    lastUpdated: '1 min ago',
    stats: {
      open: 180.68,
      high: 182.34,
      low: 180.30,
      volume: 58762341,
      avgVolume: 55982680,
      marketCap: '2.87T',
      pe: 30.25,
      dividend: '0.58%'
    },
    stockData: generateMockStockData('AAPL', 30)
  },
  'MSFT': {
    ticker: 'MSFT',
    companyName: 'Microsoft Corporation',
    price: 405.24,
    change: 3.56,
    changePercent: 0.89,
    currency: 'USD',
    marketStatus: 'open',
    lastUpdated: '2 min ago',
    stats: {
      open: 402.67,
      high: 406.12,
      low: 401.88,
      volume: 22135647,
      avgVolume: 21865432,
      marketCap: '3.05T',
      pe: 36.80,
      dividend: '0.71%'
    },
    stockData: generateMockStockData('MSFT', 30)
  },
  'GOOG': {
    ticker: 'GOOG',
    companyName: 'Alphabet Inc.',
    price: 146.95,
    change: -0.62,
    changePercent: -0.42,
    currency: 'USD',
    marketStatus: 'open',
    lastUpdated: '1 min ago',
    stats: {
      open: 147.80,
      high: 148.23,
      low: 146.55,
      volume: 20142637,
      avgVolume: 19876543,
      marketCap: '1.89T',
      pe: 25.75,
      dividend: '0.00%'
    },
    stockData: generateMockStockData('GOOG', 30)
  }
};

// Add some additional popular stocks
const additionalTickers = ['AMZN', 'NVDA', 'TSLA', 'META', 'V', 'JPM', 'WMT'];
additionalTickers.forEach(ticker => {
  mockStocks[ticker] = {
    ticker,
    companyName: `${ticker} Corporation`,
    price: Math.random() * 500 + 100,
    change: (Math.random() * 10) * (Math.random() > 0.5 ? 1 : -1),
    changePercent: (Math.random() * 3) * (Math.random() > 0.5 ? 1 : -1),
    currency: 'USD',
    marketStatus: Math.random() > 0.8 ? 'closed' : 'open',
    lastUpdated: `${Math.floor(Math.random() * 10) + 1} min ago`,
    stats: {
      open: Math.random() * 500 + 100,
      high: Math.random() * 500 + 200,
      low: Math.random() * 300 + 50,
      volume: Math.floor(Math.random() * 50000000),
      avgVolume: Math.floor(Math.random() * 40000000),
      marketCap: `${(Math.random() * 1000).toFixed(2)}B`,
      pe: Math.random() * 50 + 10,
      dividend: `${(Math.random() * 3).toFixed(2)}%`
    },
    stockData: generateMockStockData(ticker, 30)
  };
});

// API methods
export const fetchStockData = async (ticker: string): Promise<StockData> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // If ticker is in our mock data, return it
  if (mockStocks[ticker]) {
    return mockStocks[ticker];
  }
  
  // Otherwise create a new mock entry
  const newStock: StockData = {
    ticker,
    companyName: `${ticker} Inc.`,
    price: Math.random() * 200 + 50,
    change: (Math.random() * 5) * (Math.random() > 0.5 ? 1 : -1),
    changePercent: (Math.random() * 2) * (Math.random() > 0.5 ? 1 : -1),
    currency: 'USD',
    marketStatus: 'open',
    lastUpdated: 'Just now',
    stats: {
      open: Math.random() * 200 + 50,
      high: Math.random() * 220 + 60,
      low: Math.random() * 180 + 40,
      volume: Math.floor(Math.random() * 10000000),
      avgVolume: Math.floor(Math.random() * 8000000),
      marketCap: `${(Math.random() * 100).toFixed(2)}B`,
      pe: Math.random() * 30 + 5,
      dividend: `${(Math.random() * 2).toFixed(2)}%`
    },
    stockData: generateMockStockData(ticker, 30)
  };
  
  // Save it for future requests
  mockStocks[ticker] = newStock;
  return newStock;
};

export const getAIAnalysis = async (ticker: string) => {
  // In a real app this would call the OpenAI API
  // For now just simulate a delay
  toast.info("AI analysis in progress...");
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Success message would be shown by the component that called this
  return { success: true };
};
