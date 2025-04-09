
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

// Actual OpenAI API call
export const generateAIAnalysis = async (request: AIAnalysisRequest): Promise<AIAnalysisResponse> => {
  try {
    toast.loading("AI is analyzing stock data...", { id: "ai-analysis" });
    
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
    
    // Create a prompt that specifically requests values in Indian Rupees
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
    2. Support/resistance levels in Indian Rupees (₹)
    3. Risk assessment on 1-5 scale with risk level (Very Low, Low, Moderate, High, Very High)
    4. Investment recommendation (Strong Buy, Buy, Hold, Sell, Strong Sell)
    5. At least 4 identified technical patterns (like Double Bottom, Head and Shoulders, Cup and Handle, etc.)
    
    IMPORTANT: ALL monetary values MUST be in ₹ (Indian Rupees).`;
    
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
            content: 'You are a professional Indian stock market analyst. Analyze the provided Indian stock data and return ONLY a valid JSON object with these fields: "analysis" (detailed technical analysis with key patterns and trends), "supportResistance" (object with "support" and "resistance" arrays in ₹), "risk" (number 1-5), "riskLevel" (string: "Very Low", "Low", "Moderate", "High", "Very High"), "recommendation" (string: "Strong Buy", "Buy", "Hold", "Sell", "Strong Sell"), and "technicalPatterns" (array of at least 4 identified patterns like "Double Bottom", "Head and Shoulders", "Cup and Handle", "Falling Wedge", "Rising Wedge", "Bullish Flag", "Bearish Flag", "Double Top", "Triple Top", "Triple Bottom", "Rounding Bottom", "Ascending Triangle", "Descending Triangle", "Symmetrical Triangle", "Breakout", "Golden Cross", "Death Cross", etc). ALL values must be in ₹ (Indian Rupees).'
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
      const analysisContent = data.choices[0].message.content;
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
      // If parsing fails, format the response manually
      console.error("Failed to parse OpenAI response as JSON:", parseError);
      toast.error("Could not parse AI analysis properly. Using fallback data.");
      
      return {
        analysis: "Based on current price trends and market conditions, the stock appears to be showing mixed signals. Volume patterns suggest neutral accumulation/distribution activity.",
        supportResistance: {
          support: [Math.floor(request.stockData.price * 0.95), Math.floor(request.stockData.price * 0.9)],
          resistance: [Math.ceil(request.stockData.price * 1.05), Math.ceil(request.stockData.price * 1.1)]
        },
        risk: 3,
        riskLevel: "Moderate",
        recommendation: "Hold",
        technicalPatterns: ["Consolidation phase", "Trading range", "Support test", "Moving average crossover"]
      };
    }
  } catch (error) {
    toast.dismiss("ai-analysis");
    toast.error("Failed to generate AI analysis");
    console.error("AI analysis error:", error);
    
    // Return a fallback response in case of errors
    return {
      analysis: `We couldn't complete the AI analysis for ${request.ticker} due to a technical issue. Please try again later.`,
      supportResistance: {
        support: [0, 0],
        resistance: [0, 0]
      },
      risk: 3,
      riskLevel: "Moderate",
      recommendation: "Unable to determine",
      technicalPatterns: ["Analysis not available", "Data insufficient", "Technical error", "Please try again"]
    };
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
