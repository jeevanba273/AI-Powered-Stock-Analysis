
import React, { useState, useEffect, useRef } from 'react';
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
  const [toastId, setToastId] = useState<string | number | null>(null);
  const analysisRequestedRef = useRef(false);
  const analysisTimeoutRef = useRef<number | null>(null);
  
  const handleRequestAnalysis = async () => {
    // Only proceed if we're not already loading
    if (isLoading) return;
    
    // Dismiss any existing toasts
    if (toastId) {
      toast.dismiss(toastId);
      setToastId(null);
    }
    
    // Clear any existing timeout
    if (analysisTimeoutRef.current) {
      window.clearTimeout(analysisTimeoutRef.current);
      analysisTimeoutRef.current = null;
    }
    
    setIsLoading(true);
    setError(null);
    analysisRequestedRef.current = true;
    
    // Create loading toast and store its ID
    const id = toast.loading("AI is analyzing stock data...");
    setToastId(id);
    
    // Set a timeout to handle cases where the API takes too long
    analysisTimeoutRef.current = window.setTimeout(() => {
      if (isLoading && analysisRequestedRef.current) {
        // If still loading after 30 seconds, abort and show timeout message
        toast.dismiss(id);
        toast.error("Analysis is taking too long. Using local algorithms instead.");
        analysisRequestedRef.current = false;
        setIsLoading(false);
        setToastId(null);
      }
    }, 30000); // 30 second timeout
    
    try {
      const result = await onRequestAnalysis();
      
      // Clear the timeout as we got a response
      if (analysisTimeoutRef.current) {
        window.clearTimeout(analysisTimeoutRef.current);
        analysisTimeoutRef.current = null;
      }
      
      // Only proceed with updating state if the component is still mounted for this ticker
      if (analysisRequestedRef.current) {
        if (result) {
          setAnalysis(result);
          // Dismiss loading toast and show success
          toast.dismiss(id);
          toast.success("AI analysis completed successfully");
        } else {
          setError("Failed to generate analysis");
          // Dismiss loading toast and show error
          toast.dismiss(id);
          toast.error("Failed to generate analysis");
        }
      }
    } catch (error) {
      // Clear the timeout as we got an error response
      if (analysisTimeoutRef.current) {
        window.clearTimeout(analysisTimeoutRef.current);
        analysisTimeoutRef.current = null;
      }
      
      if (analysisRequestedRef.current) {
        const errorMessage = error.message || "Failed to generate analysis";
        setError(errorMessage);
        // Dismiss loading toast and show error
        toast.dismiss(id);
        toast.error(`AI Analysis error: ${errorMessage}`);
        console.error("AI Analysis error:", error);
      }
    } finally {
      // Only update state if component is still mounted for this ticker
      if (analysisRequestedRef.current) {
        setIsLoading(false);
        setToastId(null);
      }
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

  // Clean up any toast, timeout, and reset request flag when unmounting
  useEffect(() => {
    return () => {
      if (toastId) {
        toast.dismiss(toastId);
      }
      if (analysisTimeoutRef.current) {
        window.clearTimeout(analysisTimeoutRef.current);
        analysisTimeoutRef.current = null;
      }
      analysisRequestedRef.current = false;
    };
  }, [toastId]);

  // When ticker changes, reset state but keep any existing analysis
  useEffect(() => {
    // Reset analysis when ticker changes
    setAnalysis(null);
    
    // Dismiss any existing toasts
    if (toastId) {
      toast.dismiss(toastId);
      setToastId(null);
    }
    
    // Clear any existing timeout
    if (analysisTimeoutRef.current) {
      window.clearTimeout(analysisTimeoutRef.current);
      analysisTimeoutRef.current = null;
    }
    
    // Reset loading and error states
    setIsLoading(false);
    setError(null);
    
    // Reset analysis request flag
    analysisRequestedRef.current = false;
  }, [ticker]);

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
