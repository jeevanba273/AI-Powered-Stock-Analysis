
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, ArrowRight, Lightbulb, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AIAnalysisResponse } from '@/services/aiService';

interface FutureTrendAnalysisProps {
  changePercent: number;
  aiAnalysis?: AIAnalysisResponse | null;
  className?: string;
}

const FutureTrendAnalysis: React.FC<FutureTrendAnalysisProps> = ({ 
  changePercent, 
  aiAnalysis: initialAiAnalysis,
  className 
}) => {
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResponse | null>(initialAiAnalysis || null);

  // Listen for AI analysis updates from the StockAnalysis component
  useEffect(() => {
    const handleAiAnalysisUpdate = (event: CustomEvent) => {
      setAiAnalysis(event.detail.analysis);
    };

    window.addEventListener('aiAnalysisUpdated', handleAiAnalysisUpdate as EventListener);
    
    return () => {
      window.removeEventListener('aiAnalysisUpdated', handleAiAnalysisUpdate as EventListener);
    };
  }, []);

  // Update when props change
  useEffect(() => {
    if (initialAiAnalysis) {
      setAiAnalysis(initialAiAnalysis);
    }
  }, [initialAiAnalysis]);

  // Predict future trends based on current data and AI analysis
  const predictFutureTrends = () => {
    if (!aiAnalysis) return { shortTerm: null, midTerm: null, longTerm: null };
    
    // Short-term (1W) prediction based on recent momentum and technical patterns
    let shortTermBullish = changePercent > 0;
    if (aiAnalysis.technicalPatterns.some(p => 
      p.includes("Reversal") || 
      p.includes("Double Bottom") || 
      p.includes("Bullish Engulfing")
    )) {
      shortTermBullish = true;
    } else if (aiAnalysis.technicalPatterns.some(p => 
      p.includes("Double Top") || 
      p.includes("Head and Shoulders") || 
      p.includes("Bearish Engulfing")
    )) {
      shortTermBullish = false;
    }
    
    // Mid-term (1M) prediction based on AI risk level and support/resistance levels
    let midTermBullish = aiAnalysis.risk <= 3;
    const currentPrice = aiAnalysis.supportResistance.support[0] || 0;
    const nearestResistance = aiAnalysis.supportResistance.resistance[0] || Infinity;
    const upPotential = ((nearestResistance - currentPrice) / currentPrice) * 100;
    
    if (upPotential > 5) {
      midTermBullish = true;
    } else if (aiAnalysis.technicalPatterns.some(p => 
      p.includes("Downtrend") || 
      p.includes("Decreasing volume") || 
      p.includes("Resistance level formed")
    )) {
      midTermBullish = false;
    }
    
    // Long-term (3M) prediction based on AI recommendation
    const longTermBullish = ["Strong Buy", "Buy"].includes(aiAnalysis.recommendation);
    
    return {
      shortTerm: shortTermBullish,
      midTerm: midTermBullish,
      longTerm: longTermBullish
    };
  };

  const futureTrends = predictFutureTrends();

  const renderTrendIndicator = (isBullish: boolean | null, timeframe: string) => {
    if (isBullish === null) return (
      <div className="flex items-center px-3 py-2 bg-secondary/50 rounded-lg">
        <span className="text-muted-foreground text-sm">Awaiting AI analysis</span>
      </div>
    );
    
    // Create detailed explanation for each trend prediction
    let explanation = "";
    if (timeframe === "Short-term (1W)") {
      explanation = isBullish 
        ? "Positive momentum and pattern formations indicate potential short-term gains" 
        : "Recent pattern formations suggest caution in the immediate term";
    } else if (timeframe === "Mid-term (1M)") {
      explanation = isBullish 
        ? "Support/resistance profile and risk analysis favor positive mid-term outlook" 
        : "Technical indicators suggest possible consolidation or downside over the coming month";
    } else {
      explanation = isBullish 
        ? "Fundamental and technical factors align for longer-term appreciation" 
        : "Current indicators suggest defensive positioning for the coming quarter";
    }
    
    return (
      <div className={cn(
        "flex flex-col gap-1 px-3 py-2 rounded-lg",
        isBullish ? "bg-green-500/10" : "bg-red-500/10"
      )}>
        <div className="flex items-center">
          {isBullish ? (
            <TrendingUp className="h-4 w-4 text-profit" />
          ) : (
            <TrendingDown className="h-4 w-4 text-loss" />
          )}
          <span className={cn(
            "font-medium text-sm ml-2",
            isBullish ? "text-profit" : "text-loss"
          )}>
            {isBullish ? "Bullish Outlook" : "Bearish Outlook"}
          </span>
          <Badge variant="outline" className="ml-auto text-xs">
            {timeframe}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground ml-6">{explanation}</p>
      </div>
    );
  };

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center">
          <Timer className="h-5 w-5 mr-2 text-primary" />
          Future Trend Possibility
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {renderTrendIndicator(futureTrends.shortTerm, "Short-term (1W)")}
          {renderTrendIndicator(futureTrends.midTerm, "Mid-term (1M)")}
          {renderTrendIndicator(futureTrends.longTerm, "Long-term (3M)")}
        </div>
        {!aiAnalysis && (
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Generate AI analysis for complete trend predictions
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default FutureTrendAnalysis;
