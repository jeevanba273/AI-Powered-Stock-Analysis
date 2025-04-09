
// This service is being replaced by indianStockService.ts for Indian stock data
// This file is kept for backward compatibility

import { toast } from 'sonner';
import { fetchStockData as fetchIndianStockData, StockDataPoint as IndianStockDataPoint } from './indianStockService';

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
    avgVolume?: number; // Changed from required to optional
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

// API methods
export const fetchStockData = async (ticker: string): Promise<StockData> => {
  // Redirect to Indian stock service
  return fetchIndianStockData(ticker);
};

export const getAIAnalysis = async (ticker: string) => {
  // Deprecated - use the aiService directly
  toast.info("AI analysis in progress...");
  await new Promise(resolve => setTimeout(resolve, 1000));
  toast.error("Please use the AI analysis from the Indian stock service");
  return { success: false };
};
