
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StockChart from '@/components/stocks/StockChart';
import StockSummary from '@/components/stocks/StockSummary';
import StockAnalysis from '@/components/stocks/StockAnalysis';
import StockSearch from '@/components/stocks/StockSearch';
import { fetchStockData, StockData } from '@/services/indianStockService';
import { generateAIAnalysis, AIAnalysisResponse } from '@/services/aiService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CircleDashed, Gem, LineChart, Lightbulb, TrendingUp, TrendingDown, Search } from 'lucide-react';

const Index = () => {
  const [activeStock, setActiveStock] = useState<string>('TCS');
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Load initial stock on mount
    loadStockData(activeStock);
  }, []);

  const loadStockData = async (ticker: string) => {
    setIsLoading(true);
    try {
      const data = await fetchStockData(ticker);
      setStockData(data);
      setActiveStock(ticker);
    } catch (error) {
      console.error("Error fetching stock data:", error);
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
      // Pass the actual stock data to the AI service
      const analysisResult = await generateAIAnalysis({
        ticker: activeStock,
        stockData: stockData,
        indicators: {
          sma: true,
          rsi: true,
          macd: true
        }
      });
      
      return analysisResult;
    } catch (error) {
      console.error("AI analysis error:", error);
      return undefined;
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">AI-Powered Stock Analysis</h1>
        <p className="text-muted-foreground">
          Analyze stocks with advanced technical indicators and AI-powered insights
        </p>
      </div>
      
      <StockSearch onSearchStock={handleStockSearch} />
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <CircleDashed className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg">Loading stock data...</p>
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
            />
            
            <StockAnalysis 
              ticker={stockData.ticker}
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
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center">
                  <Gem className="h-5 w-5 mr-2 text-primary" />
                  Trend Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Short-term (1W)</span>
                    <div className="flex items-center">
                      {stockData.changePercent > 0 ? (
                        <>
                          <TrendingUp className="h-4 w-4 mr-1 text-profit" />
                          <span className="text-sm font-medium text-profit">Bullish</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-4 w-4 mr-1 text-loss" />
                          <span className="text-sm font-medium text-loss">Bearish</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Mid-term (1M)</span>
                    <div className="flex items-center">
                      {stockData.technicalAnalysis?.trend.macd === "Bullish" ? (
                        <>
                          <TrendingUp className="h-4 w-4 mr-1 text-profit" />
                          <span className="text-sm font-medium text-profit">Bullish</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-4 w-4 mr-1 text-loss" />
                          <span className="text-sm font-medium text-loss">Bearish</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Long-term (3M)</span>
                    <div className="flex items-center">
                      {stockData.aiInsights?.recommendation.includes("Buy") ? (
                        <>
                          <TrendingUp className="h-4 w-4 mr-1 text-profit" />
                          <span className="text-sm font-medium text-profit">Bullish</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-4 w-4 mr-1 text-loss" />
                          <span className="text-sm font-medium text-loss">Bearish</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center">
                  <LineChart className="h-5 w-5 mr-2 text-primary" />
                  Technical Indicators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="momentum">
                  <TabsList className="w-full mb-3">
                    <TabsTrigger value="momentum" className="text-xs flex-1">Momentum</TabsTrigger>
                    <TabsTrigger value="trend" className="text-xs flex-1">Trend</TabsTrigger>
                    <TabsTrigger value="volatility" className="text-xs flex-1">Volatility</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="momentum">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">RSI (14)</span>
                        <span className="text-sm font-medium">
                          {stockData.technicalAnalysis?.momentum.rsi.toFixed(1) || "62.5"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Stochastic</span>
                        <span className="text-sm font-medium">
                          {stockData.technicalAnalysis?.momentum.stochastic.toFixed(1) || "78.3"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">CCI</span>
                        <span className="text-sm font-medium">
                          {stockData.technicalAnalysis?.momentum.cci.toFixed(1) || "124.6"}
                        </span>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="trend">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">MACD</span>
                        <span className={`text-sm font-medium ${
                          stockData.technicalAnalysis?.trend.macd === "Bullish" ? "text-profit" : "text-loss"
                        }`}>
                          {stockData.technicalAnalysis?.trend.macd || "Bullish"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">ADX</span>
                        <span className="text-sm font-medium">
                          {stockData.technicalAnalysis?.trend.adx.toFixed(1) || "28.5"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">MA Cross</span>
                        <span className={`text-sm font-medium ${
                          stockData.technicalAnalysis?.trend.maCross === "Positive" ? "text-profit" : "text-loss"
                        }`}>
                          {stockData.technicalAnalysis?.trend.maCross || "Positive"}
                        </span>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="volatility">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Bollinger</span>
                        <span className="text-sm font-medium">
                          {stockData.technicalAnalysis?.volatility.bollinger || "Upper"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">ATR</span>
                        <span className="text-sm font-medium">
                          {stockData.technicalAnalysis?.volatility.atr.toFixed(2) || "3.45"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Std Dev</span>
                        <span className="text-sm font-medium">
                          {stockData.technicalAnalysis?.volatility.stdDev || "2.78%"}
                        </span>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center">
                  <Lightbulb className="h-5 w-5 mr-2 text-primary" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <p>Based on technical analysis, AI identifies these patterns:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    {stockData.aiInsights?.patterns.map((pattern, index) => (
                      <li key={index}>
                        {index === 0 ? (
                          <span className="text-profit">{pattern}</span>
                        ) : pattern}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="text-sm mt-3">
                  <p className="font-medium">Support/Resistance:</p>
                  <div className="mt-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Support:</span>
                      <span>
                        ₹{stockData.aiInsights?.supportResistance.support.join(', ₹') || '0'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Resistance:</span>
                      <span>
                        ₹{stockData.aiInsights?.supportResistance.resistance.join(', ₹') || '0'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
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
                    {stockData.newsSentiment?.overall || "Positive"}
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2 mb-3">
                  <div 
                    className="bg-profit h-2 rounded-full" 
                    style={{ width: `${stockData.newsSentiment?.positivePercentage || 75}%` }}
                  ></div>
                </div>
                <div className="space-y-3 mt-2">
                  <div className="text-xs">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-profit mr-1"></div>
                      <span className="text-muted-foreground">Positive mentions:</span>
                      <span className="ml-auto font-medium">
                        {stockData.newsSentiment?.positivePercentage || 78}%
                      </span>
                    </div>
                  </div>
                  <div className="text-xs">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground mr-1"></div>
                      <span className="text-muted-foreground">Neutral mentions:</span>
                      <span className="ml-auto font-medium">
                        {stockData.newsSentiment?.neutralPercentage || 15}%
                      </span>
                    </div>
                  </div>
                  <div className="text-xs">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-loss mr-1"></div>
                      <span className="text-muted-foreground">Negative mentions:</span>
                      <span className="ml-auto font-medium">
                        {stockData.newsSentiment?.negativePercentage || 7}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-lg text-muted-foreground">No stock data available</p>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Index;
