import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StockChart from '@/components/stocks/StockChart';
import StockSummary from '@/components/stocks/StockSummary';
import StockAnalysis from '@/components/stocks/StockAnalysis';
import StockSearch from '@/components/stocks/StockSearch';
import FutureTrendAnalysis from '@/components/stocks/FutureTrendAnalysis';
import { fetchStockData, StockData, INDIAN_API_KEY } from '@/services/indianStockService';
import { generateAIAnalysis, AIAnalysisResponse } from '@/services/aiService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CircleDashed, Gem, LineChart, Lightbulb, TrendingUp, TrendingDown, Search, KeyRound, RefreshCcw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [activeStock, setActiveStock] = useState<string>('TCS');
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load initial stock on mount
    loadStockData(activeStock);
  }, []);

  const loadStockData = async (ticker: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await fetchStockData(ticker);
      setStockData(data);
      setActiveStock(ticker);
    } catch (error) {
      console.error("Error fetching stock data:", error);
      setError(error.message || 'Failed to load data');
      toast.error(`Failed to load data for ${ticker}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStockSearch = (ticker: string) => {
    loadStockData(ticker);
  };

  const handleAIAnalysis = async (): Promise<AIAnalysisResponse | undefined> => {
    if (!stockData) return;
    
    try {
      // Pass the actual stock data to the AI service including news data
      const analysisResult = await generateAIAnalysis({
        ticker: activeStock,
        stockData: stockData,
        indicators: {
          sma: true,
          rsi: true,
          macd: true
        },
        newsData: stockData.newsData
      });
      
      return analysisResult;
    } catch (error) {
      console.error("AI analysis error:", error);
      toast.error(`Failed to generate AI analysis: ${error.message}`);
      return undefined;
    }
  };

  const handleRetry = () => {
    loadStockData(activeStock);
  };

  const handleTimeFrameChange = async (timeFrame: string) => {
    try {
      const data = await fetchStockData(activeStock, timeFrame);
      setStockData(data);
    } catch (error) {
      console.error("Error fetching stock data:", error);
      setError(error.message || 'Failed to load data');
      toast.error(`Failed to load data for ${activeStock}`);
    }
  };

  const isApiKeyError = error && 
    (error.includes('API authentication failed') || 
     error.includes('API key') || 
     error.includes('Invalid or expired API key') ||
     error.includes('Could not validate API key'));

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">NeuraStock</h1>
        <p className="text-muted-foreground">
          AI-Powered Stock Analysis Platform
        </p>
      </div>
      
      <StockSearch onSearchStock={handleStockSearch} />
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <CircleDashed className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg">Loading stock data...</p>
        </div>
      ) : error ? (
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>API Error</AlertTitle>
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
          
          {isApiKeyError && (
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <KeyRound className="h-5 w-5 mr-2 text-destructive" />
                  API Key Issue Detected
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  The application is unable to authenticate with the Indian Stock API. This is likely because:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>The API key has expired</li>
                  <li>The API key is invalid or incorrect</li>
                  <li>There's a temporary issue with the API service</li>
                </ul>
                <p className="text-sm mt-2">
                  Current API key: <code className="bg-muted px-1 py-0.5 rounded">{INDIAN_API_KEY.slice(0, 10)}...{INDIAN_API_KEY.slice(-5)}</code>
                </p>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>To fix this issue:</AlertTitle>
                  <AlertDescription>
                    Please update the API key in the <code className="bg-muted px-1 py-0.5 rounded">src/services/indianStockService.ts</code> file with a valid key.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
          
          <div className="flex justify-center">
            <Button onClick={handleRetry} className="flex items-center">
              <RefreshCcw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      ) : stockData ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <StockSummary 
              ticker={stockData.ticker}
              companyName={stockData.companyName}
              price={stockData.price}
              change={stockData.change}
              changePercent={stockData.changePercent}
              currency={stockData.currency}
              marketStatus={stockData.marketStatus}
              lastUpdated={stockData.lastUpdated}
              stats={stockData.stats}
              stockDetails={stockData.rawStockDetails}
              className="lg:col-span-1"
            >
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full mt-4 text-lg font-semibold"
                onClick={() => window.open(`/financials/${stockData.ticker}`, '_blank')}
              >
                View Detailed Financials
              </Button>
            </StockSummary>
            
            <StockAnalysis 
              ticker={stockData.ticker}
              stockData={stockData}
              onRequestAnalysis={handleAIAnalysis}
              className="lg:col-span-2"
            />
          </div>
          
          <StockChart 
            data={{
              ticker: stockData.ticker,
              stockData: stockData.stockData,
              indicators: stockData.indicators
            }}
            onTimeFrameChange={handleTimeFrameChange}
          />
          
          <div className="grid grid-cols-1 gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FutureTrendAnalysis 
                changePercent={stockData.changePercent}
                aiAnalysis={null}
                className="h-full"
              />
              
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium flex items-center">
                    <Search className="h-5 w-5 mr-2 text-primary" />
                    News Sentiment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Overall Sentiment</span>
                    <span className={`text-sm font-medium ${
                      stockData.newsSentiment?.overall === 'Positive' ? 'text-profit' : 
                      stockData.newsSentiment?.overall === 'Negative' ? 'text-loss' : 'text-muted-foreground'
                    }`}>
                      {stockData.newsSentiment?.overall || "Neutral"}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2 mb-3">
                    <div 
                      className="bg-profit h-2 rounded-full" 
                      style={{ width: `${stockData.newsSentiment?.positivePercentage || 50}%` }}
                    ></div>
                  </div>
                  <div className="space-y-3 mt-2">
                    <div className="text-xs">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-profit mr-1"></div>
                        <span className="text-muted-foreground">Positive mentions:</span>
                        <span className="ml-auto font-medium">
                          {stockData.newsSentiment?.positivePercentage || 50}%
                        </span>
                      </div>
                    </div>
                    <div className="text-xs">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground mr-1"></div>
                        <span className="text-muted-foreground">Neutral mentions:</span>
                        <span className="ml-auto font-medium">
                          {stockData.newsSentiment?.neutralPercentage || 30}%
                        </span>
                      </div>
                    </div>
                    <div className="text-xs">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-loss mr-1"></div>
                        <span className="text-muted-foreground">Negative mentions:</span>
                        <span className="ml-auto font-medium">
                          {stockData.newsSentiment?.negativePercentage || 20}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg text-muted-foreground">No stock data available</p>
          <Button onClick={handleRetry} className="mt-4">
            Retry
          </Button>
        </div>
      )}
    </div>
  );
};

export default Index;
