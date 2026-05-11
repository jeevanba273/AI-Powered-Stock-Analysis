import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CircleDashed, AlertCircle, KeyRound, RefreshCcw, Search, ArrowUpRight, ArrowDownRight, Download } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { fetchStockData, fetchHistoricalData, StockData, INDIAN_API_KEY } from '@/services/indianStockService';
import { generateAIAnalysis, AIAnalysisResponse } from '@/services/aiService';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import StockChart from '@/components/stocks/StockChart';
import StockSummary from '@/components/stocks/StockSummary';
import StockAnalysis from '@/components/stocks/StockAnalysis';
import PeerStrip from '@/components/stocks/PeerStrip';
import AnalystTargets from '@/components/stocks/AnalystTargets';
import CorporateActions from '@/components/stocks/CorporateActions';
import Forecasts from '@/components/stocks/Forecasts';
import Documents from '@/components/stocks/Documents';
import EarningsCalendar from '@/components/stocks/EarningsCalendar';
import ErrorBoundary from '@/components/ErrorBoundary';

const stockCache = new Map<string, StockData>();

const Index = () => {
  const { ticker: urlTicker } = useParams<{ ticker: string }>();
  const navigate = useNavigate();
  const [activeStock, setActiveStock] = useState<string>(urlTicker || 'TCS');
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTimeFrame, setActiveTimeFrame] = useState<string>('1Y');

  useEffect(() => {
    loadStockData(urlTicker || 'TCS');
  }, [urlTicker]);

  const loadStockData = async (ticker: string) => {
    setError(null);

    // Show cached data immediately if available (no spinner)
    const cached = stockCache.get(ticker);
    if (cached) {
      setStockData(cached);
      setActiveStock(ticker);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    // Fetch fresh data in background
    try {
      const data = await fetchStockData(ticker);
      stockCache.set(ticker, data);
      setStockData(data);
      setActiveStock(ticker);
    } catch (error: any) {
      // Only show error if we don't have cached data
      if (!cached) {
        console.error("Error fetching stock data:", error);
        setError(error.message || 'Failed to load data');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStockSearch = (ticker: string) => {
    navigate(`/stock/${ticker}`);
  };

  const handleAIAnalysis = async (): Promise<AIAnalysisResponse | undefined> => {
    if (!stockData) return;
    try {
      return await generateAIAnalysis({
        ticker: activeStock,
        stockData: stockData,
        indicators: { sma: true, rsi: true, macd: true },
        newsData: stockData.newsData
      });
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast.error(`Failed to generate analysis: ${error.message}`);
      return undefined;
    }
  };

  const handleRetry = () => loadStockData(activeStock);

  const TF_TO_PERIOD: Record<string, string> = {
    '1W': '1m', '1M': '1m', '3M': '6m', '6M': '1yr',
    '1Y': '1yr', '3Y': '3yr', '5Y': '5yr', 'MAX': 'max'
  };

  const TF_TO_DAYS: Record<string, number> = {
    '1W': 5, '1M': 22, '3M': 66, '6M': 132,
    '1Y': 252, '3Y': 756, '5Y': 1260, 'MAX': 99999
  };

  const handleTimeFrameChange = async (timeFrame: string) => {
    setActiveTimeFrame(timeFrame);

    if (timeFrame === '1D') {
      try {
        const catalogRes = await fetch('/api/stocks/catalog');
        const catalog = await catalogRes.json();
        const entry = catalog.find((s: any) =>
          s['nse-code'] === activeStock || s['bse-code'] === activeStock || s.name === activeStock
        );
        if (entry) {
          const res = await fetch(`/api/proxy/dev/1D_intraday_data?stock_id=${entry.id}`, { method: 'POST' });
          const data = await res.json();
          if (Array.isArray(data) && data[0]?.values) {
            const points = data[0].values.map((v: any) => ({
              date: v.timeStamp,
              close: Number(v.price)
            }));
            if (stockData) setStockData({ ...stockData, stockData: points });
          }
        }
      } catch (err) {
        console.error('[TimeFrame] Failed to fetch 1D intraday data:', err);
      }
      return;
    }

    const period = TF_TO_PERIOD[timeFrame] || '1yr';
    try {
      const history = await fetchHistoricalData(activeStock, period);
      const days = TF_TO_DAYS[timeFrame] || history.length;
      const sliced = history.slice(-days);
      if (stockData) {
        setStockData({ ...stockData, stockData: sliced });
      }
    } catch (err) {
      console.error(`[TimeFrame] Failed to fetch ${period} data:`, err);
    }
  };

  const handleExportPDF = async () => {
    const content = document.querySelector('.ns-content') as HTMLElement;
    if (!content || !stockData) return;
    toast.loading('Generating PDF report...', { id: 'pdf-export' });
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      // html2canvas doesn't support oklch() — set hex fallbacks temporarily
      const root = document.documentElement;
      const hexMap: Record<string, string> = {
        '--ns-bg': '#1e2230', '--ns-bg-2': '#252a3a', '--ns-surface': '#2d3348',
        '--ns-surface-2': '#353c54', '--ns-surface-hi': '#3e4660',
        '--ns-border': 'rgba(60,66,90,0.7)', '--ns-border-strong': 'rgba(80,88,115,0.8)',
        '--ns-text': '#f5f5f7', '--ns-text-2': '#c0c4d4', '--ns-text-3': '#8b8fa3',
        '--ns-text-4': '#5f6378', '--ns-profit': '#0AD88F', '--ns-profit-soft': 'rgba(10,216,143,0.14)',
        '--ns-loss': '#FF5353', '--ns-loss-soft': 'rgba(255,83,83,0.14)',
        '--ns-accent': '#5BD4E8', '--ns-accent-soft': 'rgba(91,212,232,0.16)',
      };
      const originals: Record<string, string> = {};
      for (const [k, v] of Object.entries(hexMap)) {
        originals[k] = root.style.getPropertyValue(k);
        root.style.setProperty(k, v);
      }

      const canvas = await html2canvas(content, {
        backgroundColor: '#1e2230',
        scale: 1.5,
        useCORS: true,
        logging: false,
      });

      // Restore oklch values
      for (const [k, v] of Object.entries(originals)) {
        if (v) root.style.setProperty(k, v);
        else root.style.removeProperty(k);
      }
      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      const imgW = canvas.width;
      const imgH = canvas.height;
      const pdfW = 210;
      const pdfH = (imgH * pdfW) / imgW;
      const pdf = new jsPDF('p', 'mm', [pdfW, pdfH + 20]);
      pdf.setFillColor(30, 34, 48);
      pdf.rect(0, 0, pdfW, pdfH + 20, 'F');
      pdf.setTextColor(200, 200, 210);
      pdf.setFontSize(8);
      pdf.text(`NeuraStock Report — ${stockData.ticker} — ${new Date().toLocaleDateString('en-IN')}`, 10, 8);
      pdf.addImage(imgData, 'JPEG', 0, 12, pdfW, pdfH);
      pdf.save(`NeuraStock_${stockData.ticker}_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success('PDF downloaded', { id: 'pdf-export' });
    } catch (err: any) {
      console.error('[PDF] Export failed:', err);
      toast.error('Failed to generate PDF', { id: 'pdf-export' });
    }
  };

  const isApiKeyError = error &&
    (error.includes('API authentication failed') ||
     error.includes('API key') ||
     error.includes('Invalid or expired API key'));

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ', ' +
        date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' IST';
    } catch {
      return dateString;
    }
  };

  const LoadingSkeleton = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Stock Header skeleton */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '4px 2px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="ns-skeleton" style={{ width: 56, height: 56, borderRadius: 14 }} />
          <div>
            <div className="ns-skeleton" style={{ width: 120, height: 22 }} />
            <div className="ns-skeleton" style={{ width: 200, height: 13, marginTop: 6 }} />
          </div>
          <div className="ns-skeleton" style={{ width: 180, height: 28, borderRadius: 99, marginLeft: 8 }} />
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="ns-skeleton" style={{ width: 160, height: 38, marginLeft: 'auto' }} />
          <div className="ns-skeleton" style={{ width: 120, height: 24, marginTop: 8, marginLeft: 'auto', borderRadius: 8 }} />
        </div>
      </div>

      {/* Bento: Stats + AI skeleton */}
      <div className="ns-bento">
        <div className="ns-card" style={{ padding: 18 }}>
          <div className="ns-skeleton" style={{ width: '50%', height: 12 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, marginTop: 14, background: 'var(--ns-border)', borderRadius: 12, overflow: 'hidden' }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={{ background: 'var(--ns-surface)', padding: '12px 14px' }}>
                <div className="ns-skeleton" style={{ width: '60%', height: 10 }} />
                <div className="ns-skeleton" style={{ width: '80%', height: 14, marginTop: 6 }} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, padding: 14, borderRadius: 12, background: 'var(--ns-surface)', border: '1px solid var(--ns-border)' }}>
            <div className="ns-skeleton" style={{ width: '40%', height: 10 }} />
            <div className="ns-skeleton" style={{ width: '100%', height: 6, marginTop: 14, borderRadius: 99 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <div className="ns-skeleton" style={{ width: 60, height: 10 }} />
              <div className="ns-skeleton" style={{ width: 60, height: 10 }} />
            </div>
          </div>
        </div>
        <div className="ns-card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="ns-skeleton" style={{ width: 36, height: 36, borderRadius: '50%' }} />
            <div style={{ flex: 1 }}>
              <div className="ns-skeleton" style={{ width: '40%', height: 14 }} />
              <div className="ns-skeleton" style={{ width: '60%', height: 11, marginTop: 4 }} />
            </div>
            <div className="ns-skeleton" style={{ width: 140, height: 34, borderRadius: 10 }} />
          </div>
          <div style={{ marginTop: 18, padding: '16px 18px', borderRadius: 12, background: 'var(--ns-surface)', border: '1px solid var(--ns-border)' }}>
            <div className="ns-skeleton" style={{ width: '30%', height: 10 }} />
            <div className="ns-skeleton" style={{ width: '50%', height: 22, marginTop: 6 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ padding: '12px 14px', borderRadius: 11, background: 'var(--ns-surface)', border: '1px solid var(--ns-border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="ns-skeleton" style={{ width: 32, height: 32, borderRadius: 8 }} />
                <div style={{ flex: 1 }}>
                  <div className="ns-skeleton" style={{ width: '70%', height: 12 }} />
                  <div className="ns-skeleton" style={{ width: '90%', height: 10, marginTop: 4 }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, padding: '14px 16px', borderRadius: 12, background: 'var(--ns-surface)', border: '1px solid var(--ns-border)' }}>
            <div className="ns-skeleton" style={{ width: '95%', height: 12 }} />
            <div className="ns-skeleton" style={{ width: '85%', height: 12 }} />
            <div className="ns-skeleton" style={{ width: '92%', height: 12 }} />
            <div className="ns-skeleton" style={{ width: '60%', height: 12 }} />
          </div>
        </div>
      </div>

      {/* Chart skeleton */}
      <div className="ns-card" style={{ padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div className="ns-skeleton" style={{ width: 160, height: 12 }} />
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="ns-skeleton" style={{ width: 120, height: 30, borderRadius: 10 }} />
            <div className="ns-skeleton" style={{ width: 200, height: 30, borderRadius: 10 }} />
          </div>
        </div>
        <div className="ns-skeleton" style={{ width: '100%', height: 420, borderRadius: 8 }} />
      </div>
    </div>
  );

  return (
    <div className="ns-app">
      <Sidebar activeStock={activeStock} onSelectStock={handleStockSearch} />
      <main className="ns-main">
        <TopBar onSelectStock={handleStockSearch} onRefresh={handleRetry} />
        <div className="ns-content">
          {isLoading ? (
            <LoadingSkeleton />
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
                    The API key has expired, is invalid, or the service is temporarily unavailable.
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
                  {stockData.logo ? (
                    <img src={`data:image/png;base64,${stockData.logo}`} alt={stockData.ticker} style={{ width: 56, height: 56, borderRadius: 14, objectFit: 'contain', border: '1px solid var(--ns-border-strong)' }} />
                  ) : (
                    <div className="ns-stock-logo">{stockData.ticker.slice(0, 3)}</div>
                  )}
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
                <button
                  onClick={handleExportPDF}
                  className="ns-ai-cta"
                  style={{ marginLeft: 'auto', padding: '6px 12px', fontSize: 11.5 }}
                  title="Download analysis as PDF"
                >
                  <Download size={14} /> Export PDF
                </button>
                <div className="ns-price-block">
                  <div className="ns-price tnum">
                    <span className="ns-currency">₹</span>
                    <span className="mono">{Number(stockData.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className={`ns-price-change ${stockData.change >= 0 ? 'pos' : 'neg'}`}>
                    {stockData.change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    <span className="mono tnum">{stockData.change >= 0 ? '+' : ''}{Number(stockData.change).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <span style={{ opacity: 0.5 }}>·</span>
                    <span className="mono tnum">{stockData.change >= 0 ? '+' : ''}{Number(stockData.changePercent).toFixed(2)}%</span>
                  </div>
                </div>
              </div>

              {/* Bento: Stats + AI */}
              <div className="ns-bento">
                <ErrorBoundary fallbackMessage="Failed to load stock stats">
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
                </ErrorBoundary>
                <ErrorBoundary fallbackMessage="Failed to load AI analysis">
                  <StockAnalysis
                    ticker={stockData.ticker}
                    stockData={stockData}
                    onRequestAnalysis={handleAIAnalysis}
                  />
                </ErrorBoundary>
              </div>

              {/* Chart */}
              <ErrorBoundary fallbackMessage="Failed to load chart">
                <StockChart
                  data={{
                    ticker: stockData.ticker,
                    stockData: stockData.stockData,
                    indicators: stockData.indicators
                  }}
                  onTimeFrameChange={handleTimeFrameChange}
                  activeTimeFrame={activeTimeFrame}
                />
              </ErrorBoundary>

              {/* Analyst Price Targets */}
              <ErrorBoundary fallbackMessage="Failed to load analyst targets">
                <AnalystTargets ticker={stockData.ticker} />
              </ErrorBoundary>

              {/* Stock Forecasts */}
              <ErrorBoundary fallbackMessage="Failed to load forecasts">
                <Forecasts ticker={stockData.ticker} />
              </ErrorBoundary>

              {/* Corporate Actions */}
              <ErrorBoundary fallbackMessage="Failed to load corporate actions">
                <CorporateActions ticker={stockData.ticker} />
              </ErrorBoundary>

              {/* Documents & Filings */}
              <ErrorBoundary fallbackMessage="Failed to load documents">
                <Documents ticker={stockData.ticker} />
              </ErrorBoundary>

              {/* Peer Comparison */}
              <ErrorBoundary fallbackMessage="Failed to load peer comparison">
                <PeerStrip stockDetails={stockData.rawStockDetails} />
              </ErrorBoundary>

              {/* Earnings Calendar */}
              <ErrorBoundary fallbackMessage="Failed to load earnings calendar">
                <EarningsCalendar />
              </ErrorBoundary>

              {/* News Sentiment */}
              <div className="ns-card">
                <div className="ns-card-header">
                  <div className="ns-card-title"><Search size={14} /> News Sentiment</div>
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
                  <div style={{ width: `${stockData.newsSentiment?.positivePercentage || 50}%`, background: 'var(--ns-profit)', height: 6, borderRadius: 99 }} />
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
