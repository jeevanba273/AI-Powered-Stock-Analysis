
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CircleDashed, Brain, TrendingUp, TrendingDown, Gauge, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface StockAnalysisProps {
  ticker: string;
  onRequestAnalysis: () => Promise<void>;
  className?: string;
}

// This would come from the API in a real implementation
interface AnalysisData {
  analysis: string;
  supportResistance: string;
  risk: number;
  recommendation: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
  keyMetrics: {
    pe: number;
    eps: number;
    marketCap: string;
    dividend: string;
    avgVolume: string;
    fiftyTwoWeekHigh: number;
    fiftyTwoWeekLow: number;
  };
}

const mockAnalysisData: Record<string, AnalysisData> = {
  'AAPL': {
    analysis: "Apple shows strong momentum with solid earnings and continued growth in services. Technical indicators suggest bullish sentiment in the near term, with the price breaking above a key resistance level. Volume patterns indicate accumulation and the RSI is in the upper range but not yet overbought.",
    supportResistance: "Support levels: $178.50, $175.20, $170.00\nResistance levels: $185.00, $190.00, $195.50",
    risk: 2,
    recommendation: 'Buy',
    keyMetrics: {
      pe: 30.25,
      eps: 6.14,
      marketCap: "$2.87T",
      dividend: "0.58%",
      avgVolume: "58.7M",
      fiftyTwoWeekHigh: 188.52,
      fiftyTwoWeekLow: 143.90
    }
  },
  'MSFT': {
    analysis: "Microsoft displays robust technical strength with price maintaining above key moving averages. Cloud services growth continues to drive revenue increases. Recent consolidation appears to be resolving to the upside with increasing volume, suggesting further momentum.",
    supportResistance: "Support levels: $390.00, $380.00, $365.00\nResistance levels: $410.00, $425.00, $440.00",
    risk: 2,
    recommendation: 'Strong Buy',
    keyMetrics: {
      pe: 36.80,
      eps: 11.03,
      marketCap: "$3.05T",
      dividend: "0.71%",
      avgVolume: "22.3M",
      fiftyTwoWeekHigh: 420.82,
      fiftyTwoWeekLow: 309.98
    }
  },
  'GOOG': {
    analysis: "Alphabet shows a mixed technical picture with recent price action turning bullish but momentum indicators suggesting caution. The stock is testing resistance after a period of consolidation. Earnings strength and AI initiatives provide fundamental support.",
    supportResistance: "Support levels: $142.00, $138.00, $130.00\nResistance levels: $150.00, $155.00, $160.00",
    risk: 3,
    recommendation: 'Hold',
    keyMetrics: {
      pe: 25.75,
      eps: 5.80,
      marketCap: "$1.89T",
      dividend: "0.00%",
      avgVolume: "20.1M",
      fiftyTwoWeekHigh: 155.20,
      fiftyTwoWeekLow: 102.38
    }
  }
};

const StockAnalysis: React.FC<StockAnalysisProps> = ({ ticker, onRequestAnalysis, className }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);

  const handleRequestAnalysis = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would call the API
      await onRequestAnalysis();
      // Mock response for now
      await new Promise(resolve => setTimeout(resolve, 2000));
      setAnalysis(mockAnalysisData[ticker] || mockAnalysisData['AAPL']);
      toast.success("AI analysis completed successfully");
    } catch (error) {
      toast.error("Failed to generate analysis");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'Strong Buy': return 'bg-green-700';
      case 'Buy': return 'bg-green-500';
      case 'Hold': return 'bg-yellow-500';
      case 'Sell': return 'bg-red-500';
      case 'Strong Sell': return 'bg-red-700';
      default: return 'bg-secondary';
    }
  };

  const getRiskLevel = (risk: number) => {
    const levels = ['Very Low', 'Low', 'Moderate', 'High', 'Very High'];
    return levels[risk - 1] || 'Unknown';
  };

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          <div className="flex items-center">
            <Brain className="w-5 h-5 mr-2 text-primary" />
            <span>AI-Powered Analysis</span>
          </div>
          {analysis && (
            <Badge className={cn("ml-2", getRecommendationColor(analysis.recommendation))}>
              {analysis.recommendation}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!analysis ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
            <Brain className="w-12 h-12 text-muted-foreground opacity-50" />
            <div>
              <h3 className="font-medium text-lg">Generate AI Analysis</h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-1">
                Our AI will analyze {ticker} using technical indicators, price patterns, and market trends
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-secondary/50 rounded-lg p-3">
                <h3 className="text-sm font-medium flex items-center mb-2">
                  <Gauge className="w-4 h-4 mr-1" />
                  Risk Assessment
                </h3>
                <div className="flex items-center">
                  <div className="w-full bg-secondary rounded-full h-2.5">
                    <div 
                      className={cn(
                        "h-2.5 rounded-full", 
                        analysis.risk <= 2 ? "bg-green-500" : 
                        analysis.risk === 3 ? "bg-yellow-500" : "bg-red-500"
                      )} 
                      style={{ width: `${analysis.risk * 20}%` }}
                    ></div>
                  </div>
                  <span className="ml-2 text-sm">{getRiskLevel(analysis.risk)}</span>
                </div>
              </div>
              
              <div className="bg-secondary/50 rounded-lg p-3">
                <h3 className="text-sm font-medium mb-2">Key Metrics</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <p className="text-muted-foreground">P/E:</p>
                  <p className="text-right">{analysis.keyMetrics.pe}</p>
                  <p className="text-muted-foreground">EPS:</p>
                  <p className="text-right">{analysis.keyMetrics.eps}</p>
                  <p className="text-muted-foreground">Market Cap:</p>
                  <p className="text-right">{analysis.keyMetrics.marketCap}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Technical Analysis</h3>
              <p className="text-sm text-muted-foreground">{analysis.analysis}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Support & Resistance</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary/50 p-2 rounded-lg">
                  <h4 className="text-xs font-medium text-muted-foreground mb-1 flex items-center">
                    <TrendingDown className="w-3 h-3 mr-1 text-loss" />
                    Support
                  </h4>
                  <div className="text-sm">
                    {analysis.supportResistance.split('\n')[0].replace('Support levels: ', '')}
                  </div>
                </div>
                <div className="bg-secondary/50 p-2 rounded-lg">
                  <h4 className="text-xs font-medium text-muted-foreground mb-1 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1 text-profit" />
                    Resistance
                  </h4>
                  <div className="text-sm">
                    {analysis.supportResistance.split('\n')[1].replace('Resistance levels: ', '')}
                  </div>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-sm font-medium mb-2">52 Week Range</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ArrowDownRight className="w-4 h-4 mr-1 text-loss" />
                  <span className="text-sm">{analysis.keyMetrics.fiftyTwoWeekLow}</span>
                </div>
                <div className="w-full max-w-[100px] h-1 bg-secondary rounded-full mx-2 overflow-hidden">
                  <div 
                    className="h-full bg-primary"
                    style={{ 
                      width: `${((180 - analysis.keyMetrics.fiftyTwoWeekLow) / 
                      (analysis.keyMetrics.fiftyTwoWeekHigh - analysis.keyMetrics.fiftyTwoWeekLow)) * 100}%` 
                    }}
                  ></div>
                </div>
                <div className="flex items-center">
                  <ArrowUpRight className="w-4 h-4 mr-1 text-profit" />
                  <span className="text-sm">{analysis.keyMetrics.fiftyTwoWeekHigh}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full"
          onClick={handleRequestAnalysis}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <CircleDashed className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4 mr-2" />
              {analysis ? "Refresh Analysis" : "Generate AI Analysis"}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default StockAnalysis;
