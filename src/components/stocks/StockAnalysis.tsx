
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CircleDashed, Brain, TrendingUp, TrendingDown, Gauge, ArrowUpRight, ArrowDownRight, AlertCircle, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { AIAnalysisResponse } from '@/services/aiService';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import FutureTrendAnalysis from './FutureTrendAnalysis';

interface StockAnalysisProps {
  ticker: string;
  stockData: any; // Full stock data including news
  onRequestAnalysis: () => Promise<AIAnalysisResponse | undefined>;
  className?: string;
}

const StockAnalysis: React.FC<StockAnalysisProps> = ({ ticker, stockData, onRequestAnalysis, className }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRequestAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await onRequestAnalysis();
      if (result) {
        setAnalysis(result);
        toast.success("AI analysis completed successfully");
      } else {
        setError("Failed to generate analysis");
        toast.error("Failed to generate analysis");
      }
    } catch (error) {
      const errorMessage = error.message || "Failed to generate analysis";
      setError(errorMessage);
      toast.error(`AI Analysis error: ${errorMessage}`);
      console.error("AI Analysis error:", error);
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

  // Find any FutureTrendAnalysis component rendered on the page and update it with our analysis
  useEffect(() => {
    if (analysis) {
      // Using a custom event to communicate with the FutureTrendAnalysis component
      const event = new CustomEvent('aiAnalysisUpdated', { detail: { analysis } });
      window.dispatchEvent(event);
    }
  }, [analysis]);

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
        {error ? (
          <div className="space-y-4">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertTitle>Analysis Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex justify-center">
              <Button 
                variant="outline" 
                onClick={() => setError(null)}
                className="mr-2"
              >
                Dismiss
              </Button>
              <Button
                onClick={handleRequestAnalysis}
              >
                <RefreshCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        ) : !analysis ? (
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
            <div>
              <h3 className="text-sm font-medium mb-2">Technical Analysis</h3>
              <p className="text-sm text-muted-foreground">{analysis.analysis}</p>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-sm font-medium mb-2">Recommendation Basis</h3>
              <div className="bg-secondary/50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Risk-Reward Ratio:</span>
                  <Badge className={getRecommendationColor(analysis.recommendation)}>
                    {analysis.recommendation}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Based on {analysis.technicalPatterns.length} identified patterns, 
                  {analysis.risk <= 2 ? ' low' : analysis.risk >= 4 ? ' high' : ' moderate'} risk profile, 
                  and current market conditions.
                </p>
              </div>
            </div>
            
            <div className="md:hidden">
              <FutureTrendAnalysis 
                changePercent={stockData.changePercent} 
                aiAnalysis={analysis}
              />
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
