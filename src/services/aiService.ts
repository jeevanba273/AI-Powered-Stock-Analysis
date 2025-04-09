
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
}

export interface AIAnalysisResponse {
  analysis: string;
  supportResistance: string;
  risk: number;
  recommendation: string;
}

// Actual OpenAI API call
export const generateAIAnalysis = async (request: AIAnalysisRequest): Promise<AIAnalysisResponse> => {
  try {
    toast.loading("AI is analyzing stock data...", { id: "ai-analysis" });
    
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
            content: 'You are a professional Indian stock market analyst. Analyze the stock data provided and return a JSON object with your analysis, support/resistance levels in ₹ (Indian Rupees), risk assessment (1-5), and recommendation (Strong Buy, Buy, Hold, Sell, Strong Sell).'
          },
          {
            role: 'user',
            content: `Analyze this ${request.ticker} stock. Price: ₹${request.stockData.price.toFixed(2)}, Change: ${request.stockData.change.toFixed(2)} (${request.stockData.changePercent.toFixed(2)}%). Stock data for last ${request.stockData.stockData.length} days provided. Provide technical analysis.`
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
    
    try {
      // Try to parse the content as JSON
      const analysisContent = data.choices[0].message.content;
      const analysis = JSON.parse(analysisContent);
      return analysis;
    } catch (parseError) {
      // If parsing fails, format the response manually
      console.error("Failed to parse OpenAI response as JSON:", parseError);
      const content = data.choices[0].message.content;
      
      return {
        analysis: content.slice(0, 500), // Use first part of the response
        supportResistance: `Support levels: ₹${(request.stockData.price * 0.95).toFixed(2)}, ₹${(request.stockData.price * 0.9).toFixed(2)}\nResistance levels: ₹${(request.stockData.price * 1.05).toFixed(2)}, ₹${(request.stockData.price * 1.1).toFixed(2)}`,
        risk: 3,
        recommendation: "Hold"
      };
    }
  } catch (error) {
    toast.dismiss("ai-analysis");
    toast.error("Failed to generate AI analysis");
    console.error("AI analysis error:", error);
    
    // Return a fallback response in case of errors
    return {
      analysis: `We couldn't complete the AI analysis for ${request.ticker} due to a technical issue. Please try again later.`,
      supportResistance: "Support and resistance levels unavailable",
      risk: 3,
      recommendation: "Unable to determine"
    };
  }
};
