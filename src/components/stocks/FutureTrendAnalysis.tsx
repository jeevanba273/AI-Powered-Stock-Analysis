
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, ArrowRight, Lightbulb, CheckCircle2, AlertCircle, BarChart3, LineChart, Layers, Activity } from 'lucide-react';
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

  // Short-term: Based on recent price change percentage
  const shortTermBullish = changePercent > 0;
  
  // Mid-term: Based on AI analysis risk level (lower risk = more bullish)
  const midTermBullish = aiAnalysis ? aiAnalysis.risk <= 3 : null;
  
  // Long-term: Based on AI recommendation
  const longTermBullish = aiAnalysis ? 
    ["Strong Buy", "Buy"].includes(aiAnalysis.recommendation) : null;

  const renderTrendIndicator = (isBullish: boolean | null, timeframe: string) => {
    if (isBullish === null) return (
      <div className="flex items-center px-3 py-2 bg-secondary/50 rounded-lg">
        <span className="text-muted-foreground text-sm">Awaiting AI analysis</span>
      </div>
    );
    
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg",
        isBullish ? "bg-green-500/10" : "bg-red-500/10"
      )}>
        {isBullish ? (
          <TrendingUp className="h-4 w-4 text-profit" />
        ) : (
          <TrendingDown className="h-4 w-4 text-loss" />
        )}
        <span className={cn(
          "font-medium text-sm",
          isBullish ? "text-profit" : "text-loss"
        )}>
          {isBullish ? "Bullish" : "Bearish"}
        </span>
        <Badge variant="outline" className="ml-auto text-xs">
          {timeframe}
        </Badge>
      </div>
    );
  };

  // Generate AI insights based on the analysis
  const getAIInsights = () => {
    if (!aiAnalysis) return [];
    
    // Create 5-6 bullet points of insights
    const insights = [
      `The stock is showing ${aiAnalysis.recommendation.includes('Buy') ? 'bullish' : aiAnalysis.recommendation.includes('Sell') ? 'bearish' : 'neutral'} signals with a ${aiAnalysis.riskLevel.toLowerCase()} risk profile.`,
      `Primary technical pattern identified: ${aiAnalysis.technicalPatterns[0] || 'N/A'}.`,
      `Key support level at ₹${aiAnalysis.supportResistance.support[0]?.toLocaleString() || 'N/A'} with secondary support at ₹${aiAnalysis.supportResistance.support[1]?.toLocaleString() || 'N/A'}.`,
      `Immediate resistance detected at ₹${aiAnalysis.supportResistance.resistance[0]?.toLocaleString() || 'N/A'}.`,
      `${aiAnalysis.technicalPatterns.length > 1 ? `Additional pattern: ${aiAnalysis.technicalPatterns[1]}` : 'No additional patterns detected'}.`,
      aiAnalysis.risk <= 2 
        ? 'Risk-reward ratio appears favorable for entry positions.'
        : aiAnalysis.risk >= 4
          ? 'Current risk-reward ratio suggests caution before entering new positions.'
          : 'Risk-reward ratio is balanced, consider position sizing carefully.'
    ];
    
    return insights;
  };

  return (
    <div className={cn("space-y-4", className)}>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center">
            <ArrowRight className="h-5 w-5 mr-2 text-primary" />
            Future Trend Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {renderTrendIndicator(shortTermBullish, "Short-term (1W)")}
            {renderTrendIndicator(midTermBullish, "Mid-term (1M)")}
            {renderTrendIndicator(longTermBullish, "Long-term (3M)")}
          </div>
          {!aiAnalysis && (
            <p className="text-xs text-muted-foreground mt-3">
              Generate AI analysis for complete trend predictions
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FutureTrendAnalysis;
