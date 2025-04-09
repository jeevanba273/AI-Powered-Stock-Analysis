
import { toast } from 'sonner';

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
  rawStockDetails?: any; // Raw stock details from API
}

export interface MarketIndex {
  name: string;
  price: string;
  percentChange: string;
  netChange: string;
  tickerId: string;
  exchangeType: string;
}

// Generate mock data for fallback
const generateMockHistoricalData = (ticker: string, days: number = 90): StockDataPoint[] => {
  const data: StockDataPoint[] = [];
  const basePrice = Math.random() * 1000 + 500; // Random base price between 500 and 1500
  const today = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Create some random but somewhat realistic price movement
    const randomChange = (Math.random() - 0.5) * 20;
    const close = i === days ? basePrice : data[0].close * (1 + randomChange/1000);
    const high = close * (1 + Math.random() * 0.02);
    const low = close * (1 - Math.random() * 0.02);
    const open = low + Math.random() * (high - low);
    const volume = Math.floor(Math.random() * 10000000) + 100000;
    
    data.unshift({
      date: date.toISOString().split('T')[0],
      open,
      high,
      low,
      close,
      volume
    });
  }
  
  return data;
};

// Generate mock stock details based on real data format
const generateMockStockDetails = (ticker: string): Record<string, any> => {
  const randomPrice = Math.floor(Math.random() * 3000) + 500;
  const yearLow = randomPrice * 0.8;
  const yearHigh = randomPrice * 1.2;
  
  return {
    name: `${ticker} Ltd.`,
    company_summary: `${ticker} is a leading Indian company in its sector.`,
    industry: "Technology",
    price_data: {
      nse: { yearLowPrice: yearLow, yearHighPrice: yearHigh },
      bse: { yearLowPrice: yearLow * 0.98, yearHighPrice: yearHigh * 1.02 }
    },
    stats: {
      marketCap: Math.random() * 100000,
      pbRatio: Math.random() * 10 + 1,
      peRatio: Math.random() * 30 + 5,
      divYield: Math.random() * 5,
      bookValue: Math.random() * 500 + 100,
      epsTtm: Math.random() * 100 + 10,
      roe: Math.random() * 25,
      industryPe: Math.random() * 30 + 5,
      cappedType: "Large Cap",
      dividendYieldInPercent: Math.random() * 5,
      faceValue: 1,
      debtToEquity: Math.random() * 2,
      returnOnAssets: Math.random() * 15,
      returnOnEquity: Math.random() * 25,
      operatingProfitMargin: Math.random() * 30,
      netProfitMargin: Math.random() * 20
    },
    fundamentals: [
      {
        name: "Market Cap",
        shortName: "Mkt Cap",
        value: `₹${Math.floor(Math.random() * 100000)}Cr`
      },
      {
        name: "ROE",
        shortName: "ROE",
        value: `${(Math.random() * 30 + 10).toFixed(2)}%`
      },
      {
        name: "P/E Ratio(TTM)",
        shortName: "P/E Ratio(TTM)",
        value: (Math.random() * 30 + 5).toFixed(2)
      },
      {
        name: "EPS(TTM)",
        shortName: "EPS(TTM)",
        value: (Math.random() * 100 + 10).toFixed(2)
      },
      {
        name: "P/B Ratio",
        shortName: "P/B Ratio",
        value: (Math.random() * 10 + 1).toFixed(2)
      },
      {
        name: "Dividend Yield",
        shortName: "Div Yield",
        value: `${(Math.random() * 5).toFixed(2)}%`
      }
    ],
    financials: [
      {
        title: "Revenue",
        yearly: {
          "2020": Math.floor(Math.random() * 100000) + 10000,
          "2021": Math.floor(Math.random() * 100000) + 20000,
          "2022": Math.floor(Math.random() * 100000) + 30000,
          "2023": Math.floor(Math.random() * 100000) + 40000,
          "2024": Math.floor(Math.random() * 100000) + 50000
        },
        quarterly: {
          "Dec '23": Math.floor(Math.random() * 20000) + 10000,
          "Mar '24": Math.floor(Math.random() * 20000) + 11000,
          "Jun '24": Math.floor(Math.random() * 20000) + 12000,
          "Sep '24": Math.floor(Math.random() * 20000) + 13000,
          "Dec '24": Math.floor(Math.random() * 20000) + 14000
        }
      },
      {
        title: "Profit",
        yearly: {
          "2020": Math.floor(Math.random() * 20000) + 5000,
          "2021": Math.floor(Math.random() * 20000) + 6000,
          "2022": Math.floor(Math.random() * 20000) + 7000,
          "2023": Math.floor(Math.random() * 20000) + 8000,
          "2024": Math.floor(Math.random() * 20000) + 9000
        },
        quarterly: {
          "Dec '23": Math.floor(Math.random() * 5000) + 2000,
          "Mar '24": Math.floor(Math.random() * 5000) + 2200,
          "Jun '24": Math.floor(Math.random() * 5000) + 2400,
          "Sep '24": Math.floor(Math.random() * 5000) + 2600,
          "Dec '24": Math.floor(Math.random() * 5000) + 2800
        }
      },
      {
        title: "Net Worth",
        yearly: {
          "2020": Math.floor(Math.random() * 80000) + 40000,
          "2021": Math.floor(Math.random() * 80000) + 45000,
          "2022": Math.floor(Math.random() * 80000) + 50000,
          "2023": Math.floor(Math.random() * 80000) + 55000,
          "2024": Math.floor(Math.random() * 80000) + 60000
        }
      }
    ]
  };
};

// API call to fetch historical data
const fetchHistoricalData = async (ticker: string, period: string = '3yr'): Promise<StockDataPoint[]> => {
  try {
    console.log(`Fetching historical data for ${ticker}...`);
    const url = `https://dev.indianapi.in/historical_data?stock_name=${ticker}&period=${period}&filter=price`;
    
    const headers = {
      'Authorization': `Bearer ${INDIAN_API_KEY}`,
      'Content-Type': 'application/json'
    };
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      console.error(`API error: ${response.status} - ${await response.text()}`);
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Historical data received for ${ticker}`);
    
    // Extract price data
    const priceData = data.datasets.find((dataset: any) => dataset.metric === 'Price')?.values || [];
    const volumeData = data.datasets.find((dataset: any) => dataset.metric === 'Volume')?.values || [];
    
    // Map to our StockDataPoint format
    return priceData.map((item: any, index: number) => {
      const date = item[0] as string;
      const close = parseFloat(item[1] as string);
      
      // Find corresponding volume data if available
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
    toast.error('Falling back to sample data for historical prices');
    // Return mock data as fallback
    return generateMockHistoricalData(ticker);
  }
};

// API call to fetch stock details
const fetchStockDetails = async (ticker: string): Promise<Record<string, any>> => {
  try {
    console.log(`Fetching stock details for ${ticker}...`);
    const url = `https://dev.indianapi.in/get_stock_data?stock_name=${ticker}`;
    
    const headers = {
      'Authorization': `Bearer ${INDIAN_API_KEY}`,
      'Content-Type': 'application/json'
    };
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      console.error(`API error: ${response.status} - ${await response.text()}`);
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Stock details received for ${ticker}:`, data);
    return data;
  } catch (error) {
    console.error('Error fetching stock details:', error);
    toast.error('Falling back to sample data for stock details');
    // Return mock data as fallback
    return generateMockStockDetails(ticker);
  }
};

// Generate technical analysis based on stock data
const generateTechnicalAnalysis = (stockData: StockDataPoint[]) => {
  // In a real scenario, we would calculate these from the historical data
  return {
    momentum: {
      rsi: parseFloat((Math.random() * 40 + 30).toFixed(1)), // Random RSI between 30-70
      stochastic: parseFloat((Math.random() * 60 + 20).toFixed(1)), // Random stochastic between 20-80
      cci: parseFloat((Math.random() * 200 - 100).toFixed(1)) // Random CCI between -100 and 100
    },
    trend: {
      macd: Math.random() > 0.5 ? "Bullish" : "Bearish",
      adx: parseFloat((Math.random() * 30 + 10).toFixed(1)), // Random ADX between 10-40
      maCross: Math.random() > 0.5 ? "Positive" : "Negative"
    },
    volatility: {
      bollinger: ["Upper", "Middle", "Lower"][Math.floor(Math.random() * 3)],
      atr: parseFloat((Math.random() * 5 + 1).toFixed(2)), // Random ATR between 1-6
      stdDev: `${(Math.random() * 5 + 1).toFixed(2)}%` // Random StdDev between 1%-6%
    }
  };
};

// Generate AI insights based on stock data
const generateAIInsights = (stockData: StockDataPoint[], price: number) => {
  // In a real scenario, these would come from an AI model analysis
  const patterns = [
    "Double bottom formation",
    "Increasing volume on up days",
    "RSI uptrend without overbought conditions",
    "Price consolidation near resistance",
    "Bullish engulfing pattern",
    "Symmetrical triangle formation",
    "Head and shoulders pattern",
    "Cup and handle formation"
  ];
  
  // Randomly select 4-6 patterns
  const numPatterns = Math.floor(Math.random() * 3) + 4; // 4-6 patterns
  const selectedPatterns = [...patterns].sort(() => 0.5 - Math.random()).slice(0, numPatterns);
  
  // Generate support and resistance levels around the current price
  const supportLevels = [
    parseFloat((price * 0.95).toFixed(2)),
    parseFloat((price * 0.9).toFixed(2))
  ];
  
  const resistanceLevels = [
    parseFloat((price * 1.05).toFixed(2)),
    parseFloat((price * 1.1).toFixed(2))
  ];
  
  return {
    patterns: selectedPatterns,
    supportResistance: {
      support: supportLevels,
      resistance: resistanceLevels
    },
    risk: Math.floor(Math.random() * 5) + 1, // Random risk level 1-5
    recommendation: ["Strong Buy", "Buy", "Hold", "Sell", "Strong Sell"][Math.floor(Math.random() * 5)]
  };
};

// Generate news sentiment
const generateNewsSentiment = () => {
  // In a real scenario, this would be based on actual news analysis
  const positivePercentage = Math.floor(Math.random() * 60) + 20; // 20%-80%
  const negativePercentage = Math.floor(Math.random() * 30); // 0%-30%
  const neutralPercentage = 100 - positivePercentage - negativePercentage;
  
  let overall;
  if (positivePercentage > 65) overall = "Positive";
  else if (positivePercentage < 35) overall = "Negative";
  else overall = "Neutral";
  
  return {
    overall,
    positivePercentage,
    neutralPercentage,
    negativePercentage
  };
};

export const fetchStockData = async (ticker: string): Promise<StockData> => {
  try {
    toast.loading(`Fetching data for ${ticker}...`, { id: "fetch-stock" });
    
    // Fetch historical data and stock details
    const historicalData = await fetchHistoricalData(ticker);
    const stockDetails = await fetchStockDetails(ticker);
    
    toast.dismiss("fetch-stock");
    toast.success(`Data loaded for ${ticker}`);
    
    // Get latest price and calculate change
    const latestPrice = historicalData.length > 0 ? historicalData[historicalData.length - 1].close : 0;
    const previousPrice = historicalData.length > 1 ? historicalData[historicalData.length - 2].close : latestPrice;
    const change = latestPrice - previousPrice;
    const changePercent = previousPrice === 0 ? 0 : (change / previousPrice) * 100;
    
    // Extract relevant statistics
    const pe = typeof stockDetails.stats?.peRatio === 'number' ? stockDetails.stats.peRatio : 0;
    const dividend = typeof stockDetails.stats?.divYield === 'number' 
      ? `${stockDetails.stats.divYield}%` 
      : '0%';
    const marketCap = typeof stockDetails.stats?.marketCap === 'number'
      ? `₹${(stockDetails.stats.marketCap).toFixed(2)}Cr`
      : '₹0Cr';
      
    // Get volume from historical data
    const volume = historicalData.length > 0 && historicalData[historicalData.length - 1].volume 
      ? historicalData[historicalData.length - 1].volume as number 
      : 0;
    
    // Generate additional analysis data
    const technicalAnalysis = generateTechnicalAnalysis(historicalData);
    const aiInsights = generateAIInsights(historicalData, latestPrice);
    const newsSentiment = generateNewsSentiment();
    
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
        open: historicalData.length > 0 && historicalData[historicalData.length - 1].open 
          ? historicalData[historicalData.length - 1].open as number 
          : latestPrice,
        high: stockDetails.price_data?.nse?.yearHighPrice || 0,
        low: stockDetails.price_data?.nse?.yearLowPrice || 0,
        volume,
        avgVolume: volume, // We don't have average volume in the data
        marketCap,
        pe,
        dividend,
        bookValue: typeof stockDetails.stats?.bookValue === 'number' ? stockDetails.stats.bookValue : 0,
        debtToEquity: typeof stockDetails.stats?.debtToEquity === 'number' ? stockDetails.stats.debtToEquity : 0,
        roe: typeof stockDetails.stats?.roe === 'number' ? stockDetails.stats.roe : 0
      },
      stockData: historicalData,
      technicalAnalysis,
      aiInsights,
      newsSentiment,
      rawStockDetails: stockDetails // Store the raw stock details from API
    };
    
    return stockData;
  } catch (error) {
    console.error('Error in fetchStockData:', error);
    toast.dismiss("fetch-stock");
    toast.error(`Failed to fetch data for ${ticker}`);
    
    // Return fallback mock data in case of any errors
    const historicalData = generateMockHistoricalData(ticker);
    const mockPrice = historicalData[historicalData.length - 1].close;
    const mockStockDetails = generateMockStockDetails(ticker);
    
    // Generate additional analysis data for the mock data
    const technicalAnalysis = generateTechnicalAnalysis(historicalData);
    const aiInsights = generateAIInsights(historicalData, mockPrice);
    const newsSentiment = generateNewsSentiment();
    
    return {
      ticker,
      companyName: `${ticker} Ltd.`,
      price: mockPrice,
      change: mockPrice * 0.01,
      changePercent: 1.0,
      currency: '₹',
      marketStatus: 'open',
      lastUpdated: new Date().toLocaleTimeString(),
      stats: {
        open: mockPrice * 0.99,
        high: mockPrice * 1.02,
        low: mockPrice * 0.98,
        volume: 1000000,
        avgVolume: 1200000,
        marketCap: '₹10000Cr',
        pe: 15,
        dividend: '2%',
        bookValue: 100,
        debtToEquity: 0.5,
        roe: 15
      },
      stockData: historicalData,
      technicalAnalysis,
      aiInsights,
      newsSentiment,
      rawStockDetails: mockStockDetails
    };
  }
};

// Fetch market indices data (Nifty 50, Bank Nifty, India VIX)
export const fetchMarketIndices = async (): Promise<MarketIndex[]> => {
  try {
    console.log("Fetching market indices data...");
    const targetIndices = ["NIFTY 50", "NIFTY Bank", "India VIX"];
    let indices: MarketIndex[] = [];
    
    // Fetch popular indices (for Nifty 50 and India VIX)
    const popularUrl = "https://dev.indianapi.in/indices?exchange=NSE&index_type=POPULAR";
    const popularResponse = await fetch(popularUrl, {
      headers: {
        'Authorization': `Bearer ${INDIAN_API_KEY}`,
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
    }
    
    // Fetch sectoral indices (for Bank Nifty)
    const sectoralUrl = "https://dev.indianapi.in/indices?exchange=NSE&index_type=SECTOR";
    const sectoralResponse = await fetch(sectoralUrl, {
      headers: {
        'Authorization': `Bearer ${INDIAN_API_KEY}`,
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
    }
    
    console.log("Fetched market indices:", indices);
    
    if (indices.length === 0) {
      throw new Error("No indices data found");
    }
    
    return indices;
  } catch (error) {
    console.error("Error fetching market indices:", error);
    // Return mock data as fallback
    return [
      {
        name: "NIFTY 50",
        price: "22399.15",
        percentChange: "-0.61",
        netChange: "-136.7",
        tickerId: "I0002",
        exchangeType: "NSI"
      },
      {
        name: "NIFTY Bank",
        price: "50240.15",
        percentChange: "-0.54",
        netChange: "-270.85",
        tickerId: "I0006",
        exchangeType: "NSI"
      },
      {
        name: "India VIX",
        price: "21.43",
        percentChange: "4.8306",
        netChange: "0.9875",
        tickerId: "I0012",
        exchangeType: "NSI"
      }
    ];
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
