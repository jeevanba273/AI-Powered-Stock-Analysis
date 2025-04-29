
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CircleDashed, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { AIAnalysisResponse } from '@/services/aiService';
import AIAnalysisResults from './AIAnalysisResults';
import AILoadingState from './AILoadingState';
import AIErrorState from './AIErrorState';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

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

  useEffect(() => {
    if (analysis) {
      const event = new CustomEvent('aiAnalysisUpdated', { detail: { analysis } });
      window.dispatchEvent(event);
    }
  }, [analysis]);

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <CardTitle className={cn("text-lg font-semibold flex items-center justify-between", isMobile && "flex-col items-start gap-2")}>
          <div className="flex items-center">
            <Brain className="w-5 h-5 mr-2 text-primary" />
            <span>AI-Powered Analysis</span>
          </div>
          {analysis && (
            <Badge className={cn("ml-2 text-base px-3 py-1", getRecommendationColor(analysis.recommendation))}>
              {analysis.recommendation}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <AIErrorState 
            error={error}
            onDismiss={() => setError(null)} 
            onRetry={handleRequestAnalysis}
          />
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
            <CircleDashed className="w-12 h-12 animate-spin text-primary" />
            <div>
              <h3 className="font-medium text-lg">Analyzing {ticker}...</h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-1">
                Our AI is analyzing technical indicators, price patterns, and market trends
              </p>
            </div>
          </div>
        ) : !analysis ? (
          <AILoadingState ticker={ticker} />
        ) : (
          <AIAnalysisResults 
            analysis={analysis}
            stockData={stockData}
          />
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
