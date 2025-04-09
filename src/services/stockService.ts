
// This service is being replaced by indianStockService.ts for Indian stock data
// This file is kept for backward compatibility

import { toast } from 'sonner';
import { 
  fetchStockData as fetchIndianStockData, 
  StockDataPoint as IndianStockDataPoint, 
  StockData as IndianStockData 
} from './indianStockService';

export interface StockDataPoint {
  date: string;
  open?: number; // Optional to match indianStockService
  high?: number; // Optional to match indianStockService
  low?: number;  // Optional to match indianStockService
  close: number;
  volume?: number; // Optional to match indianStockService
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
    avgVolume?: number; // Optional to match indianStockService
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
  technicalAnalysis?: {
    momentum: {
      rsi: number;
      stochastic: number;
      cci: number;
    };
    trend: {
      macd: string;
      adx: number;
      maCross: string;
    };
    volatility: {
      bollinger: string;
      atr: number;
      stdDev: string;
    };
  };
  aiInsights?: {
    patterns: string[];
    supportResistance: {
      support: number[];
      resistance: number[];
    };
    risk: number;
    recommendation: string;
  };
  newsSentiment?: {
    overall: string;
    positivePercentage: number;
    neutralPercentage: number;
    negativePercentage: number;
  };
}

// API methods
export const fetchStockData = async (ticker: string): Promise<StockData> => {
  // Redirect to Indian stock service
  return fetchIndianStockData(ticker) as Promise<StockData>;
};

export const getAIAnalysis = async (ticker: string) => {
  // Deprecated - use the aiService directly
  toast.info("AI analysis in progress...");
  await new Promise(resolve => setTimeout(resolve, 1000));
  toast.error("Please use the AI analysis from the Indian stock service");
  return { success: false };
};
