import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { CircleDashed, AlertCircle, KeyRound, RefreshCcw, Search, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { fetchStockData, StockData, INDIAN_API_KEY } from '@/services/indianStockService';
import { generateAIAnalysis, AIAnalysisResponse } from '@/services/aiService';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import StockChart from '@/components/stocks/StockChart';
import StockSummary from '@/components/stocks/StockSummary';
import StockAnalysis from '@/components/stocks/StockAnalysis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Index = () => {
  const [activeStock, setActiveStock] = useState<string>('TCS');
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTimeFrame, setActiveTimeFrame] = useState<string>('1M');

  useEffect(() => {
    loadStockData(activeStock);
  }, []);

  const loadStockData = async (ticker: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchStockData(ticker);
      setStockData(data);
      setActiveStock(ticker);
    } catch (error: any) {
      console.error("Error fetching stock data:", error);
      setError(error.message || 'Failed to load data');
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
      const analysisResult = await generateAIAnalysis({
        ticker: activeStock,
        stockData: stockData,
        indicators: { sma: true, rsi: true, macd: true },
        newsData: stockData.newsData
      });
      return analysisResult;
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast.error(`Failed to generate analysis: ${error.message}`);
      return undefined;
    }
  };

  const handleRetry = () => {
    loadStockData(activeStock);
  };

  const handleTimeFrameChange = (timeFrame: string) => {
    setActiveTimeFrame(timeFrame);
    fetchStockData(activeStock)
      .then(data => setStockData(data))
      .catch(error => {
        console.error("Error fetching stock data:", error);
        toast.error(`Failed to load data for ${activeStock}`);
      });
  };

  const isApiKeyError = error &&
    (error.includes('API authentication failed') ||
     error.includes('API key') ||
     error.includes('Invalid or expired API key') ||
     error.includes('Could not validate API key'));

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ', ' +
        date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' IST';
    } catch {
      return dateString;
    }
  };

  return (
    <div className="ns-app">
      <Sidebar activeStock={activeStock} onSelectStock={handleStockSearch} />
      <main className="ns-main">
        <TopBar onSelectStock={handleStockSearch} onRefresh={() => loadStockData(activeStock)} />
        <div className="ns-content">
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
              <CircleDashed className="animate-spin" size={48} style={{ color: 'var(--ns-accent)', marginBottom: 16 }} />
              <p style={{ fontSize: 16, color: 'var(--ns-text-2)' }}>Loading stock data...</p>
            </div>
          ) : error ? (
            <div style={{ maxWidth: 600, margin: '40px auto' }}>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>API Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              {isApiKeyError && (
                <div className="ns-card" style={{ marginTop: 16, borderColor: 'var(--ns-loss)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <KeyRound size={18} style={{ color: 'var(--ns-loss)' }} />
                    <span style={{ fontWeight: 600 }}>API Key Issue Detected</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--ns-text-2)', lineHeight: 1.6 }}>
                    The API key has expired, is invalid, or the API service is temporarily unavailable.
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--ns-text-3)', marginTop: 8 }} className="mono">
                    Key: {INDIAN_API_KEY.slice(0, 10)}...{INDIAN_API_KEY.slice(-5)}
                  </p>
                </div>
              )}
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Button onClick={handleRetry}><RefreshCcw size={14} style={{ marginRight: 6 }} /> Retry</Button>
              </div>
            </div>
          ) : stockData ? (
            <>
              {/* Stock Header */}
              <div className="ns-stock-header ns-fade-up">
                <div className="ns-stock-id">
                  <div className="ns-stock-logo">{stockData.ticker.slice(0, 3)}</div>
                  <div className="ns-stock-meta">
                    <h1>
                      <span>{stockData.ticker}</span>
                      <span className="ns-exch">NSE</span>
                    </h1>
                    <div className="ns-stock-name">{stockData.companyName}</div>
                  </div>
                  <div className="ns-market-status" style={{ marginLeft: 8 }}>
                    <span className={stockData.marketStatus === 'open' ? 'ns-live-dot' : ''} style={stockData.marketStatus !== 'open' ? { width: 7, height: 7, borderRadius: 99, background: 'var(--ns-loss)' } : {}} />
                    <span>{stockData.marketStatus === 'open' ? 'Market Open' : 'Market Closed'}</span>
                    <span style={{ color: 'var(--ns-text-4)' }}>·</span>
                    <span className="mono" style={{ color: 'var(--ns-text-3)' }}>{formatDateTime(stockData.lastUpdated)}</span>
                  </div>
                </div>
                <div className="ns-price-block">
                  <div className="ns-price tnum">
                    <span className="ns-currency">₹</span>
                    <span className="mono">{Number(stockData.price).toFixed(2)}</span>
                  </div>
                  <div className={`ns-price-change ${stockData.change >= 0 ? 'pos' : 'neg'}`}>
                    {stockData.change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    <span className="mono tnum">{stockData.change >= 0 ? '+' : ''}{Number(stockData.change).toFixed(2)}</span>
                    <span style={{ opacity: 0.5 }}>·</span>
                    <span className="mono tnum">{stockData.change >= 0 ? '+' : ''}{Number(stockData.changePercent).toFixed(2)}%</span>
                  </div>
                </div>
              </div>

              {/* Bento: Stats + AI */}
              <div className="ns-bento">
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
                />
                <StockAnalysis
                  ticker={stockData.ticker}
                  stockData={stockData}
                  onRequestAnalysis={handleAIAnalysis}
                />
              </div>

              {/* Chart */}
              <StockChart
                data={{
                  ticker: stockData.ticker,
                  stockData: stockData.stockData,
                  indicators: stockData.indicators
                }}
                onTimeFrameChange={handleTimeFrameChange}
                activeTimeFrame={activeTimeFrame}
              />

              {/* News Sentiment */}
              <div className="ns-card">
                <div className="ns-card-header">
                  <div className="ns-card-title">
                    <Search size={14} /> News Sentiment
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: 'var(--ns-text-3)' }}>Overall Sentiment</span>
                  <span style={{
                    fontSize: 12, fontWeight: 600,
                    color: stockData.newsSentiment?.overall === 'Positive' ? 'var(--ns-profit)' :
                      stockData.newsSentiment?.overall === 'Negative' ? 'var(--ns-loss)' : 'var(--ns-text-3)'
                  }}>
                    {stockData.newsSentiment?.overall || "Neutral"}
                  </span>
                </div>
                <div style={{ width: '100%', background: 'var(--ns-surface)', borderRadius: 99, height: 6, marginBottom: 12 }}>
                  <div
                    style={{
                      width: `${stockData.newsSentiment?.positivePercentage || 50}%`,
                      background: 'var(--ns-profit)', height: 6, borderRadius: 99
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { label: 'Positive', pct: stockData.newsSentiment?.positivePercentage || 50, color: 'var(--ns-profit)' },
                    { label: 'Neutral', pct: stockData.newsSentiment?.neutralPercentage || 30, color: 'var(--ns-text-4)' },
                    { label: 'Negative', pct: stockData.newsSentiment?.negativePercentage || 20, color: 'var(--ns-loss)' },
                  ].map(s => (
                    <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                      <span style={{ color: 'var(--ns-text-3)' }}>{s.label}</span>
                      <span className="mono tnum" style={{ marginLeft: 'auto', fontWeight: 600 }}>{s.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
              <AlertCircle size={48} style={{ color: 'var(--ns-text-3)', marginBottom: 16 }} />
              <p style={{ fontSize: 16, color: 'var(--ns-text-3)' }}>No stock data available</p>
              <Button onClick={handleRetry} style={{ marginTop: 16 }}>Retry</Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
