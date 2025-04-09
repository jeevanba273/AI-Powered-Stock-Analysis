
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, ArrowRight, Gauge, AlertCircle, Lightbulb } from 'lucide-react';
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

  const getRiskColor = (risk: number) => {
    switch (risk) {
      case 1: return 'bg-emerald-500';
      case 2: return 'bg-green-500';
      case 3: return 'bg-yellow-500';
      case 4: return 'bg-orange-500';
      case 5: return 'bg-red-500';
      default: return 'bg-secondary';
    }
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

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center">
            <Lightbulb className="h-5 w-5 mr-2 text-primary" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!aiAnalysis ? (
            <p className="text-sm text-muted-foreground">
              Generate AI analysis to view detailed insights
            </p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary/50 rounded-lg p-3">
                  <h3 className="text-sm font-medium flex items-center mb-2">
                    <Gauge className="w-4 h-4 mr-1" />
                    Risk Assessment
                  </h3>
                  <div className="flex items-center">
                    <div className="w-full bg-secondary rounded-full h-2.5">
                      <div 
                        className={cn("h-2.5 rounded-full", getRiskColor(aiAnalysis.risk))} 
                        style={{ width: `${aiAnalysis.risk * 20}%` }}
                      ></div>
                    </div>
                    <span className="ml-2 text-sm">{aiAnalysis.riskLevel}</span>
                  </div>
                </div>

                <div className="bg-secondary/50 rounded-lg p-3">
                  <h3 className="text-sm font-medium flex items-center mb-2">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Technical Patterns
                  </h3>
                  <div className="space-y-1 max-h-20 overflow-y-auto">
                    {aiAnalysis.technicalPatterns.slice(0, 3).map((pattern, idx) => (
                      <div key={idx} className="flex items-center text-xs">
                        <AlertCircle className="w-3 h-3 mr-1 text-primary" />
                        <span>{pattern}</span>
                      </div>
                    ))}
                    {aiAnalysis.technicalPatterns.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        + {aiAnalysis.technicalPatterns.length - 3} more patterns
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Support & Resistance</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-secondary/50 p-2 rounded-lg">
                    <h4 className="text-xs font-medium text-muted-foreground mb-1 flex items-center">
                      <TrendingDown className="w-3 h-3 mr-1 text-loss" />
                      Support Levels
                    </h4>
                    <div className="text-sm">
                      {aiAnalysis.supportResistance.support.map((level, idx) => (
                        <span key={idx} className="mr-2">₹{level.toLocaleString()}</span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-secondary/50 p-2 rounded-lg">
                    <h4 className="text-xs font-medium text-muted-foreground mb-1 flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1 text-profit" />
                      Resistance Levels
                    </h4>
                    <div className="text-sm">
                      {aiAnalysis.supportResistance.resistance.map((level, idx) => (
                        <span key={idx} className="mr-2">₹{level.toLocaleString()}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FutureTrendAnalysis;
