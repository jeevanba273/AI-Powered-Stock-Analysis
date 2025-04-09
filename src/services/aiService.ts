// This service connects to the OpenAI API

import { toast } from 'sonner';

// Get API key from indianStockService
import { OPENAI_API_KEY } from './indianStockService';

export interface AIAnalysisRequest {
  ticker: string;
  stockData: any; // This would be properly typed in a real app
  indicators: {
    sma?: boolean;
    ema?: boolean;
    rsi?: boolean;
    macd?: boolean;
    bollinger?: boolean;
  };
  newsData?: any[]; // Optional news data
}

export interface AIAnalysisResponse {
  analysis: string;
  supportResistance: {
    support: number[];
    resistance: number[];
  };
  risk: number;
  riskLevel: string;
  recommendation: string;
  technicalPatterns: string[];
}

// Helper function to extract numerical values from string with currency symbols
const extractNumericValues = (jsonString: string): string => {
  // Replace ₹ with empty string before values
  return jsonString.replace(/₹\s*(\d+)/g, '$1');
};

// Calculate risk level based on stock data
const calculateRiskLevel = (stockData: any): number => {
  let riskScore = 3; // Default moderate risk
  
  // Adjust risk based on volatility
  const priceData = stockData.stockData || [];
  if (priceData.length >= 5) {
    // Calculate price volatility
    const prices = priceData.map((point: any) => point.close);
    const mean = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
    const variance = prices.reduce((a: number, b: number) => a + Math.pow(b - mean, 2), 0) / prices.length;
    const volatility = Math.sqrt(variance) / mean;
    
    // Adjust risk based on volatility
    if (volatility > 0.05) riskScore += 1;
    if (volatility > 0.1) riskScore += 1;
    if (volatility < 0.02) riskScore -= 1;
    if (volatility < 0.01) riskScore -= 1;
  }
  
  // Adjust risk based on PE ratio if available
  if (stockData.stats && stockData.stats.pe) {
    const pe = parseFloat(stockData.stats.pe);
    if (pe > 40) riskScore += 1;
    if (pe < 15) riskScore -= 1;
  }
  
  // Adjust based on recent trend
  if (stockData.changePercent < -5) riskScore += 1;
  if (stockData.changePercent > 5) riskScore += 1;
  if (stockData.changePercent > -1 && stockData.changePercent < 1) riskScore -= 1;
  
  // Ensure risk is within 1-5 range
  return Math.max(1, Math.min(5, riskScore));
};

// Detect technical patterns from price data - ENHANCED VERSION
const detectTechnicalPatterns = (stockData: any): string[] => {
  const patterns = [];
  const priceData = stockData.stockData || [];
  
  if (priceData.length < 10) return ["Insufficient data for pattern detection"];
  
  // Get recent prices
  const closes = priceData.map((point: any) => point.close);
  const opens = priceData.map((point: any) => point.open);
  const highs = priceData.map((point: any) => point.high);
  const lows = priceData.map((point: any) => point.low);
  const volumes = priceData.map((point: any) => point.volume);
  
  // Detect trend - KEEP THIS AS FIRST PATTERN
  const recentTrend = closes[closes.length - 1] > closes[closes.length - 10] 
    ? "Uptrend" : "Downtrend";
  patterns.push(recentTrend);
  
  // Volume trend - KEEP THIS AS SECOND PATTERN
  const volumeTrend = volumes[volumes.length - 1] > volumes[volumes.length - 5]
    ? "Increasing volume" : "Decreasing volume";
  patterns.push(volumeTrend);
  
  // RSI-like calculation (simplified)
  const gains = [];
  const losses = [];
  for (let i = 1; i < closes.length; i++) {
    const change = closes[i] - closes[i-1];
    if (change >= 0) {
      gains.push(change);
      losses.push(0);
    } else {
      gains.push(0);
      losses.push(Math.abs(change));
    }
  }
  
  // Calculate average gain and loss over 14 periods (or less if not enough data)
  const periods = Math.min(14, gains.length);
  const avgGain = gains.slice(-periods).reduce((sum, val) => sum + val, 0) / periods;
  const avgLoss = losses.slice(-periods).reduce((sum, val) => sum + val, 0) / periods;
  
  // Calculate RSI
  const rs = avgLoss > 0 ? avgGain / avgLoss : 100;
  const rsi = 100 - (100 / (1 + rs));
  
  // RSI-based pattern
  if (rsi > 70) {
    patterns.push("Overbought conditions (RSI > 70)");
  } else if (rsi < 30) {
    patterns.push("Oversold conditions (RSI < 30)");
  }
  
  // Bollinger Bands-like calculation (simplified)
  const priceWindow = closes.slice(-20); // Last 20 days
  const sma = priceWindow.reduce((sum, price) => sum + price, 0) / priceWindow.length;
  const priceStdDev = Math.sqrt(
    priceWindow.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / priceWindow.length
  );
  const upperBand = sma + (2 * priceStdDev);
  const lowerBand = sma - (2 * priceStdDev);
  
  // Bollinger Band signal
  if (closes[closes.length - 1] > upperBand) {
    patterns.push("Price above upper Bollinger Band");
  } else if (closes[closes.length - 1] < lowerBand) {
    patterns.push("Price below lower Bollinger Band");
  } else if (
    closes[closes.length - 2] < lowerBand && 
    closes[closes.length - 1] > lowerBand
  ) {
    patterns.push("Bollinger Band bounce (bullish)");
  }
  
  // Moving Average Crossovers (simple implementation)
  if (priceData.length >= 50) {
    const sma20 = closes.slice(-20).reduce((sum, price) => sum + price, 0) / 20;
    const sma50 = closes.slice(-50).reduce((sum, price) => sum + price, 0) / 50;
    const sma20Previous = closes.slice(-21, -1).reduce((sum, price) => sum + price, 0) / 20;
    const sma50Previous = closes.slice(-51, -1).reduce((sum, price) => sum + price, 0) / 50;
    
    if (sma20Previous < sma50Previous && sma20 > sma50) {
      patterns.push("Golden Cross (SMA20 crossed above SMA50)");
    } else if (sma20Previous > sma50Previous && sma20 < sma50) {
      patterns.push("Death Cross (SMA20 crossed below SMA50)");
    }
  }
  
  // Detect doji candle pattern (open and close very close to each other)
  const recentCandles = 5;
  for (let i = priceData.length - recentCandles; i < priceData.length; i++) {
    if (i >= 0) {
      const bodySize = Math.abs(opens[i] - closes[i]);
      const shadowSize = highs[i] - lows[i];
      if (bodySize < 0.1 * shadowSize) {
        patterns.push("Doji pattern (indecision in the market)");
        break;
      }
    }
  }
  
  // MACD-like calculation (simplified)
  if (priceData.length >= 26) {
    const ema12 = calculateEMA(closes, 12);
    const ema26 = calculateEMA(closes, 26);
    const macd = ema12 - ema26;
    const macdSignal = calculateEMA(
      Array(9).fill(0).map((_, i) => {
        const idx = closes.length - 9 + i;
        if (idx >= 0 && idx < closes.length) {
          return calculateEMA(closes.slice(0, idx + 1), 12) - calculateEMA(closes.slice(0, idx + 1), 26);
        }
        return 0;
      }),
      9
    );
    
    if (macd > macdSignal && macd > 0) {
      patterns.push("Bullish MACD crossover");
    } else if (macd < macdSignal && macd < 0) {
      patterns.push("Bearish MACD crossover");
    }
  }
  
  // Check for price channel breakout
  const recentHighs = highs.slice(-10);
  const recentLows = lows.slice(-10);
  const maxHigh = Math.max(...recentHighs.slice(0, -1));
  const minLow = Math.min(...recentLows.slice(0, -1));
  
  if (highs[highs.length - 1] > maxHigh) {
    patterns.push("Resistance breakout (bullish)");
  } else if (lows[lows.length - 1] < minLow) {
    patterns.push("Support breakdown (bearish)");
  }
  
  // Check for three white soldiers / three black crows (simplified)
  if (priceData.length >= 3) {
    const lastThreeCandles = priceData.slice(-3);
    let whiteCount = 0;
    let blackCount = 0;
    
    for (const candle of lastThreeCandles) {
      if (candle.close > candle.open) whiteCount++;
      if (candle.close < candle.open) blackCount++;
    }
    
    if (whiteCount === 3) {
      patterns.push("Three white soldiers (bullish reversal)");
    } else if (blackCount === 3) {
      patterns.push("Three black crows (bearish reversal)");
    }
  }
  
  // Return a diverse set of patterns
  return patterns.slice(0, 6);
};

// Helper function for EMA calculation
const calculateEMA = (data: number[], period: number): number => {
  const k = 2 / (period + 1);
  // Start with simple moving average
  let ema = data.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
  
  // Calculate EMA
  for (let i = period; i < data.length; i++) {
    ema = (data[i] * k) + (ema * (1 - k));
  }
  
  return ema;
};

// Calculate support and resistance levels
const calculateSupportResistance = (stockData: any): { support: number[], resistance: number[] } => {
  const priceData = stockData.stockData || [];
  const closes = priceData.map((point: any) => point.close);
  
  if (closes.length < 5) {
    const currentPrice = stockData.price || 100;
    return {
      support: [Math.floor(currentPrice * 0.95), Math.floor(currentPrice * 0.9)],
      resistance: [Math.ceil(currentPrice * 1.05), Math.ceil(currentPrice * 1.1)]
    };
  }
  
  // Find local minima for support
  const supports = [];
  for (let i = 2; i < closes.length - 2; i++) {
    if (closes[i] < closes[i-1] && 
        closes[i] < closes[i-2] && 
        closes[i] < closes[i+1] && 
        closes[i] < closes[i+2]) {
      supports.push(closes[i]);
    }
  }
  
  // Find local maxima for resistance
  const resistances = [];
  for (let i = 2; i < closes.length - 2; i++) {
    if (closes[i] > closes[i-1] && 
        closes[i] > closes[i-2] && 
        closes[i] > closes[i+1] && 
        closes[i] > closes[i+2]) {
      resistances.push(closes[i]);
    }
  }
  
  // If no clear levels found, calculate based on current price
  const currentPrice = stockData.price || closes[closes.length - 1];
  
  if (supports.length < 2) {
    supports.push(Math.floor(currentPrice * 0.95));
    supports.push(Math.floor(currentPrice * 0.9));
  }
  
  if (resistances.length < 2) {
    resistances.push(Math.ceil(currentPrice * 1.05));
    resistances.push(Math.ceil(currentPrice * 1.1));
  }
  
  // Sort and take the 2 closest levels
  const sortedSupports = supports
    .sort((a, b) => b - a)
    .filter(s => s < currentPrice)
    .slice(0, 2);
  
  const sortedResistances = resistances
    .sort((a, b) => a - b)
    .filter(r => r > currentPrice)
    .slice(0, 2);
  
  return {
    support: sortedSupports.length ? sortedSupports : [Math.floor(currentPrice * 0.95), Math.floor(currentPrice * 0.9)],
    resistance: sortedResistances.length ? sortedResistances : [Math.ceil(currentPrice * 1.05), Math.ceil(currentPrice * 1.1)]
  };
};

// Generate recommendation based on technical analysis
const generateRecommendation = (stockData: any, risk: number): string => {
  const priceData = stockData.stockData || [];
  if (priceData.length < 5) return "Hold";
  
  const closes = priceData.map((point: any) => point.close);
  const currentPrice = closes[closes.length - 1];
  
  // Calculate short-term momentum (last 5 days)
  const shortTerm = (currentPrice / closes[Math.max(0, closes.length - 5)]) - 1;
  
  // Calculate medium-term momentum (last 15 days or half of available data)
  const mediumLookback = Math.min(15, Math.floor(closes.length / 2));
  const mediumTerm = (currentPrice / closes[Math.max(0, closes.length - mediumLookback)]) - 1;
  
  // Evaluate momentum and risk to generate recommendation
  if (shortTerm > 0.05 && mediumTerm > 0.03 && risk <= 3) {
    return "Strong Buy";
  } else if (shortTerm > 0.02 && mediumTerm > 0.01 && risk <= 4) {
    return "Buy";
  } else if (shortTerm < -0.05 && mediumTerm < -0.03 && risk >= 3) {
    return "Strong Sell";
  } else if (shortTerm < -0.02 && mediumTerm < -0.01 && risk >= 2) {
    return "Sell";
  } else {
    return "Hold";
  }
};

// Generate analysis text based on data
const generateAnalysisText = (stockData: any, patterns: string[], recommendation: string, risk: number): string => {
  const ticker = stockData.ticker;
  const currentPrice = stockData.price;
  const changePercent = stockData.changePercent;
  
  let analysis = `${ticker} is currently trading at ₹${currentPrice.toFixed(2)}, showing a ${changePercent > 0 ? 'positive' : 'negative'} ${Math.abs(changePercent).toFixed(2)}% movement. `;
  
  // Add pattern information
  if (patterns.includes("Uptrend")) {
    analysis += `The stock is in an uptrend, indicating bullish momentum. `;
  } else if (patterns.includes("Downtrend")) {
    analysis += `The stock is in a downtrend, showing bearish pressure. `;
  }
  
  // Add volume analysis
  if (patterns.includes("Increasing volume")) {
    analysis += `Trading volume is increasing, which ${recommendation.includes("Buy") ? 'supports the current price movement' : 'may signal upcoming volatility'}. `;
  } else if (patterns.includes("Decreasing volume")) {
    analysis += `Trading volume is declining, which may indicate ${recommendation.includes("Sell") ? 'weakening momentum' : 'consolidation before the next move'}. `;
  }
  
  // Add pattern information
  if (patterns.includes("Double Top") || patterns.includes("Head and Shoulders")) {
    analysis += `Technical indicators show a potential reversal pattern (${patterns.includes("Double Top") ? 'Double Top' : 'Head and Shoulders'}), which often signals upcoming bearish movement. `;
  } else if (patterns.includes("Double Bottom")) {
    analysis += `A Double Bottom pattern has been detected, which typically indicates a potential bullish reversal. `;
  }
  
  // Add risk assessment
  const riskLevels = ["Very Low", "Low", "Moderate", "High", "Very High"];
  analysis += `The stock currently presents a ${riskLevels[risk-1]} risk profile. `;
  
  // Finish with recommendation
  analysis += `Based on the current technical setup and market conditions, the overall recommendation is ${recommendation.toUpperCase()}.`;
  
  return analysis;
};

// Actual OpenAI API call
export const generateAIAnalysis = async (request: AIAnalysisRequest): Promise<AIAnalysisResponse> => {
  try {
    toast.loading("AI is analyzing stock data...", { id: "ai-analysis" });
    
    // First try to generate a more accurate analysis using our own algorithms
    try {
      // Calculate risk based on stock volatility and fundamentals
      const risk = calculateRiskLevel(request.stockData);
      const riskLevel = getRiskLevelFromValue(risk);
      
      // Detect patterns from price movements
      const patterns = detectTechnicalPatterns(request.stockData);
      
      // Calculate support and resistance
      const supportResistance = calculateSupportResistance(request.stockData);
      
      // Generate recommendation
      const recommendation = generateRecommendation(request.stockData, risk);
      
      // Generate detailed analysis text
      const analysisText = generateAnalysisText(request.stockData, patterns, recommendation, risk);
      
      toast.dismiss("ai-analysis");
      toast.success("AI analysis generated successfully");
      
      // Return our computed analysis
      return {
        analysis: analysisText,
        supportResistance: supportResistance,
        risk: risk,
        riskLevel: riskLevel,
        recommendation: recommendation,
        technicalPatterns: patterns.slice(0, 4) // Take first 4 patterns
      };
    } catch (algorithmError) {
      console.error("Error in local analysis algorithms:", algorithmError);
      // Fall back to OpenAI if our algorithms fail
    }
    
    // Create a more detailed prompt for the AI
    const latestPrice = request.stockData.price;
    const latestDate = new Date().toISOString().split('T')[0];
    
    // Build a comprehensive context for the AI
    let newsContext = "";
    if (request.newsData && request.newsData.length > 0) {
      newsContext = `Recent news headlines for ${request.ticker}:\n`;
      request.newsData.forEach((news, index) => {
        newsContext += `${index + 1}. ${news.title} (${news.published})\n`;
      });
    }
    
    // Create a prompt that specifically formats values without currency symbols for easier parsing
    const prompt = `Analyze this ${request.ticker} stock based on the latest real-time data as of ${latestDate}. 
    Current price: ₹${request.stockData.price.toFixed(2)}, 
    Change: ₹${request.stockData.change.toFixed(2)} (${request.stockData.changePercent.toFixed(2)}%).
    
    Latest fundamental data:
    Market Cap: ${request.stockData.stats.marketCap}
    P/E Ratio: ${request.stockData.stats.pe}
    Book Value: ${request.stockData.stats.bookValue || 'N/A'}
    ROE: ${request.stockData.stats.roe || 'N/A'}
    Debt to Equity: ${request.stockData.stats.debtToEquity || 'N/A'}
    
    ${newsContext}
    
    Provide a detailed technical analysis for this Indian stock with:
    1. Detailed analysis of key patterns and trends
    2. Support/resistance levels as numeric values only (no currency symbols)
    3. Risk assessment on 1-5 scale with risk level (Very Low, Low, Moderate, High, Very High)
    4. Investment recommendation (Strong Buy, Buy, Hold, Sell, Strong Sell)
    5. At least 4 identified technical patterns (like Double Bottom, Head and Shoulders, Cup and Handle, etc.)
    
    IMPORTANT: Return ALL numeric values WITHOUT currency symbols to ensure proper JSON parsing.`;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a professional Indian stock market analyst. Analyze the provided Indian stock data and return ONLY a valid JSON object with these fields: "analysis" (detailed technical analysis with key patterns and trends), "supportResistance" (object with "support" and "resistance" arrays containing numbers only, NO currency symbols), "risk" (number 1-5), "riskLevel" (string: "Very Low", "Low", "Moderate", "High", "Very High"), "recommendation" (string: "Strong Buy", "Buy", "Hold", "Sell", "Strong Sell"), and "technicalPatterns" (array of at least 4 identified patterns like "Double Bottom", "Head and Shoulders", "Cup and Handle", etc). DO NOT include currency symbols in numeric values.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2
      }),
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    toast.dismiss("ai-analysis");
    console.log("OpenAI response:", data.choices[0].message.content);
    
    try {
      // Try to parse the content as JSON
      let analysisContent = data.choices[0].message.content;
      
      // Replace currency symbols to fix parsing issues
      analysisContent = extractNumericValues(analysisContent);
      
      // Extract JSON if wrapped in markdown code blocks
      const jsonContent = analysisContent.includes("```json") 
        ? analysisContent.split("```json")[1].split("```")[0].trim()
        : analysisContent.includes("```") 
          ? analysisContent.split("```")[1].split("```")[0].trim()
          : analysisContent;
          
      const analysis = JSON.parse(jsonContent);
      
      // Ensure the response has the expected structure
      return {
        analysis: analysis.analysis || "Analysis not available",
        supportResistance: analysis.supportResistance || { 
          support: [Math.floor(request.stockData.price * 0.95), Math.floor(request.stockData.price * 0.9)],
          resistance: [Math.ceil(request.stockData.price * 1.05), Math.ceil(request.stockData.price * 1.1)]
        },
        risk: analysis.risk || 3,
        riskLevel: analysis.riskLevel || getRiskLevelFromValue(analysis.risk || 3),
        recommendation: analysis.recommendation || "Hold",
        technicalPatterns: analysis.technicalPatterns || ["Consolidation", "Trading range", "Support test", "Moving average crossover"]
      };
    } catch (parseError) {
      // If parsing fails, use our local algorithms as a fallback
      console.error("Failed to parse OpenAI response as JSON:", parseError);
      toast.error("Could not parse AI analysis properly. Using algorithmic analysis instead.");
      
      // Calculate risk based on stock volatility and fundamentals
      const risk = calculateRiskLevel(request.stockData);
      const riskLevel = getRiskLevelFromValue(risk);
      
      // Detect patterns from price movements
      const patterns = detectTechnicalPatterns(request.stockData);
      
      // Calculate support and resistance
      const supportResistance = calculateSupportResistance(request.stockData);
      
      // Generate recommendation
      const recommendation = generateRecommendation(request.stockData, risk);
      
      // Generate detailed analysis text
      const analysisText = generateAnalysisText(request.stockData, patterns, recommendation, risk);
      
      return {
        analysis: analysisText,
        supportResistance: supportResistance,
        risk: risk,
        riskLevel: riskLevel,
        recommendation: recommendation,
        technicalPatterns: patterns.slice(0, 4) // Take first 4 patterns
      };
    }
  } catch (error) {
    toast.dismiss("ai-analysis");
    toast.error("Failed to generate AI analysis");
    console.error("AI analysis error:", error);
    
    // Use our local algorithms as a fallback
    try {
      // Calculate risk based on stock volatility and fundamentals
      const risk = calculateRiskLevel(request.stockData);
      const riskLevel = getRiskLevelFromValue(risk);
      
      // Detect patterns from price movements
      const patterns = detectTechnicalPatterns(request.stockData);
      
      // Calculate support and resistance
      const supportResistance = calculateSupportResistance(request.stockData);
      
      // Generate recommendation
      const recommendation = generateRecommendation(request.stockData, risk);
      
      // Generate detailed analysis text
      const analysisText = generateAnalysisText(request.stockData, patterns, recommendation, risk);
      
      return {
        analysis: analysisText,
        supportResistance: supportResistance,
        risk: risk,
        riskLevel: riskLevel,
        recommendation: recommendation,
        technicalPatterns: patterns.slice(0, 4) // Take first 4 patterns
      };
    } catch (algorithmError) {
      console.error("Fallback analysis also failed:", algorithmError);
      
      // Return a generic fallback response in case all else fails
      return {
        analysis: `We couldn't complete the AI analysis for ${request.ticker} due to a technical issue. Please try again later.`,
        supportResistance: {
          support: [Math.floor(request.stockData.price * 0.95), Math.floor(request.stockData.price * 0.9)],
          resistance: [Math.ceil(request.stockData.price * 1.05), Math.ceil(request.stockData.price * 1.1)]
        },
        risk: 3,
        riskLevel: "Moderate",
        recommendation: "Hold",
        technicalPatterns: ["Analysis not available", "Data insufficient", "Technical error", "Please try again"]
      };
    }
  }
};

// Helper function to get risk level from numerical value
function getRiskLevelFromValue(risk: number): string {
  switch (risk) {
    case 1: return "Very Low";
    case 2: return "Low";
    case 3: return "Moderate";
    case 4: return "High";
    case 5: return "Very High";
    default: return "Moderate";
  }
}

// AI-based news sentiment analysis
export const analyzeNewsSentiment = async (ticker: string, newsData: any[]): Promise<any> => {
  if (!newsData || newsData.length === 0) {
    return {
      overall: "Neutral",
      positivePercentage: 50,
      neutralPercentage: 30,
      negativePercentage: 20
    };
  }
  
  try {
    toast.loading("Analyzing news sentiment...", { id: "news-sentiment" });
    
    // Format news data for the prompt
    const newsText = newsData.map((item, idx) => 
      `${idx + 1}. ${item.title} (${item.published})`
    ).join('\n');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert financial news analyst. Analyze the sentiment of these news articles about a stock and return ONLY a valid JSON object with these fields: "overall" (string: "Positive", "Neutral", or "Negative"), "positivePercentage" (number 0-100), "neutralPercentage" (number 0-100), "negativePercentage" (number 0-100). The percentages should add up to 100.'
          },
          {
            role: 'user',
            content: `Analyze the sentiment of these recent news articles about ${ticker}:\n\n${newsText}`
          }
        ],
        temperature: 0.1
      }),
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    toast.dismiss("news-sentiment");
    
    try {
      // Try to parse the content as JSON
      const content = data.choices[0].message.content;
      const jsonContent = content.includes("```json") 
        ? content.split("```json")[1].split("```")[0].trim()
        : content.includes("```") 
          ? content.split("```")[1].split("```")[0].trim()
          : content;
          
      return JSON.parse(jsonContent);
    } catch (parseError) {
      console.error("Failed to parse sentiment analysis:", parseError);
      return {
        overall: "Neutral",
        positivePercentage: 50,
        neutralPercentage: 30,
        negativePercentage: 20
      };
    }
  } catch (error) {
    toast.dismiss("news-sentiment");
    console.error("News sentiment analysis error:", error);
    return {
      overall: "Neutral",
      positivePercentage: 50,
      neutralPercentage: 30,
      negativePercentage: 20
    };
  }
};
