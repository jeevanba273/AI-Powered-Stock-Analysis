import React, { useState } from 'react';
import { Layers, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface StockSummaryProps {
  ticker: string;
  companyName: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  marketStatus: 'open' | 'closed' | 'pre-market' | 'after-hours';
  lastUpdated: string;
  stats: {
    open: number;
    high: number;
    low: number;
    volume: number;
    avgVolume?: number;
    marketCap: string;
    pe: number;
    dividend: string;
    [key: string]: any;
  };
  className?: string;
  stockDetails?: any;
}

const formatVolume = (v: number) => {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(2) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(2) + 'K';
  return v.toString();
};

const StockSummary: React.FC<StockSummaryProps> = ({
  ticker, companyName, price, change, changePercent, currency,
  marketStatus, lastUpdated, stats, className, stockDetails,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const dayRangePct = stats.high !== stats.low
    ? ((price - stats.low) / (stats.high - stats.low)) * 100
    : 50;

  const yearHigh = stockDetails?.price_data?.nse?.yearHighPrice || price * 1.15;
  const yearLow = stockDetails?.price_data?.nse?.yearLowPrice || price * 0.85;
  const yearPct = yearHigh !== yearLow
    ? ((price - yearLow) / (yearHigh - yearLow)) * 100
    : 50;

  return (
    <div className={`ns-card ${className || ''}`} style={{ padding: 18 }}>
      <div className="ns-card-header">
        <div className="ns-card-title"><Layers size={14} /> Key Stats</div>
        <div style={{ fontSize: 10.5, color: 'var(--ns-text-4)', letterSpacing: '0.06em' }}>
          {marketStatus === 'open' ? 'LIVE' : 'CLOSED'}
        </div>
      </div>

      <div className="ns-stat-stack">
        <div className="ns-stat">
          <div className="ns-stat-label">Open</div>
          <div className="ns-stat-val mono tnum">{currency}{stats.open.toFixed(2)}</div>
        </div>
        <div className="ns-stat">
          <div className="ns-stat-label">Volume</div>
          <div className="ns-stat-val mono tnum">{formatVolume(stats.volume)}</div>
          {stats.avgVolume && <div className="ns-stat-sub">Avg {formatVolume(stats.avgVolume)}</div>}
        </div>
        <div className="ns-stat">
          <div className="ns-stat-label">Market Cap</div>
          <div className="ns-stat-val mono">{stats.marketCap}</div>
        </div>
        <div className="ns-stat">
          <div className="ns-stat-label">P/E TTM</div>
          <div className="ns-stat-val mono tnum">{stats.pe.toFixed(2)}</div>
        </div>
        <div className="ns-stat">
          <div className="ns-stat-label">Dividend</div>
          <div className="ns-stat-val mono" style={{ fontSize: 13 }}>{stats.dividend}</div>
        </div>
        <div className="ns-stat">
          <div className="ns-stat-label">Day High</div>
          <div className="ns-stat-val mono tnum">{currency}{stats.high.toFixed(2)}</div>
        </div>
      </div>

      {/* Day Range */}
      <div className="ns-range">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--ns-text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>Day Range</div>
          <div className="mono" style={{ fontSize: 10.5, color: 'var(--ns-text-4)' }}>{dayRangePct.toFixed(0)}%</div>
        </div>
        <div className="ns-range-track">
          <div className="ns-range-fill" />
          <div className="ns-range-marker" style={{ left: `${Math.max(2, Math.min(98, dayRangePct))}%` }} />
        </div>
        <div className="ns-range-labels">
          <span className="mono">{currency}{stats.low.toFixed(2)}</span>
          <span className="mono">{currency}{stats.high.toFixed(2)}</span>
        </div>

        {/* 52-Week Range */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 }}>
          <div style={{ fontSize: 11, color: 'var(--ns-text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>52-Week Range</div>
          <div className="mono" style={{ fontSize: 10.5, color: 'var(--ns-text-4)' }}>{yearPct.toFixed(0)}%</div>
        </div>
        <div className="ns-range-track">
          <div className="ns-range-fill" />
          <div className="ns-range-marker" style={{ left: `${Math.max(2, Math.min(98, yearPct))}%` }} />
        </div>
        <div className="ns-range-labels">
          <span className="mono">{currency}{yearLow.toFixed(2)}</span>
          <span className="mono">{currency}{yearHigh.toFixed(2)}</span>
        </div>
      </div>

      {/* Detailed Financials Dialog */}
      <div style={{ marginTop: 14 }}>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <button className="ns-ai-cta" style={{ width: '100%', justifyContent: 'center' }}>
              View Detailed Financials
              <ChevronRight size={14} />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{ticker} - Detailed Financials</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="fundamentals">Fundamentals</TabsTrigger>
                <TabsTrigger value="financials">Financials</TabsTrigger>
                <TabsTrigger value="stats">Advanced Stats</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-4">
                <div style={{ background: 'var(--ns-surface)', border: '1px solid var(--ns-border)', borderRadius: 12, padding: 16 }}>
                  <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Company Overview</h3>
                  <p style={{ fontSize: 13, color: 'var(--ns-text-2)', lineHeight: 1.6 }}>
                    {stockDetails?.company_summary || `No summary available for ${companyName}.`}
                  </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ background: 'var(--ns-surface)', border: '1px solid var(--ns-border)', borderRadius: 12, padding: 16 }}>
                    <h3 style={{ fontWeight: 600, marginBottom: 4 }}>Industry</h3>
                    <p style={{ fontSize: 13 }}>{stockDetails?.industry || "Technology"}</p>
                  </div>
                  <div style={{ background: 'var(--ns-surface)', border: '1px solid var(--ns-border)', borderRadius: 12, padding: 16 }}>
                    <h3 style={{ fontWeight: 600, marginBottom: 4 }}>Stock Type</h3>
                    <p style={{ fontSize: 13 }}>{stockDetails?.stats?.cappedType || "Large Cap"}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="fundamentals" className="space-y-4">
                <div style={{ background: 'var(--ns-surface)', border: '1px solid var(--ns-border)', borderRadius: 12, padding: 16 }}>
                  <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Key Fundamentals</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {stockDetails?.fundamentals?.map((item: any, index: number) => (
                      <div key={index} style={{ borderBottom: '1px solid var(--ns-border)', paddingBottom: 8 }}>
                        <div style={{ fontSize: 10.5, color: 'var(--ns-text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.name}</div>
                        <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{item.value}</div>
                      </div>
                    )) || <p style={{ fontSize: 13, color: 'var(--ns-text-3)' }}>No data available.</p>}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="financials" className="space-y-4">
                {stockDetails?.financials?.map((item: any, index: number) => (
                  <div key={index} style={{ background: 'var(--ns-surface)', border: '1px solid var(--ns-border)', borderRadius: 12, padding: 16 }}>
                    <h3 style={{ fontWeight: 600, marginBottom: 8 }}>{item.title}</h3>
                    {item.yearly && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 10.5, color: 'var(--ns-text-3)', marginBottom: 4 }}>Yearly (in Cr)</div>
                        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(5, Object.keys(item.yearly).length)}, 1fr)`, gap: 8 }}>
                          {Object.entries(item.yearly).map(([year, value]: [string, any]) => (
                            <div key={year} style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: 11, fontWeight: 600 }}>{year}</div>
                              <div className="mono tnum" style={{ fontSize: 13 }}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {item.quarterly && (
                      <div>
                        <div style={{ fontSize: 10.5, color: 'var(--ns-text-3)', marginBottom: 4 }}>Quarterly (in Cr)</div>
                        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(5, Object.keys(item.quarterly).length)}, 1fr)`, gap: 8 }}>
                          {Object.entries(item.quarterly).map(([quarter, value]: [string, any]) => (
                            <div key={quarter} style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: 11, fontWeight: 600 }}>{quarter}</div>
                              <div className="mono tnum" style={{ fontSize: 13 }}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )) || <p style={{ fontSize: 13, color: 'var(--ns-text-3)' }}>No financial data available.</p>}
              </TabsContent>

              <TabsContent value="stats" className="space-y-4">
                <div style={{ background: 'var(--ns-surface)', border: '1px solid var(--ns-border)', borderRadius: 12, padding: 16 }}>
                  <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Advanced Statistics</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    {stockDetails?.stats && Object.entries(stockDetails.stats)
                      .filter(([key]) => typeof stockDetails.stats[key] !== 'object')
                      .map(([key, value]: [string, any]) => (
                        <div key={key} style={{ borderBottom: '1px solid var(--ns-border)', paddingBottom: 8 }}>
                          <div style={{ fontSize: 10.5, color: 'var(--ns-text-3)', textTransform: 'capitalize' }}>
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                          </div>
                          <div className="mono" style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>
                            {typeof value === 'number' ? value.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : String(value)}
                          </div>
                        </div>
                      )) || <p style={{ fontSize: 13, color: 'var(--ns-text-3)' }}>No stats available.</p>}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default StockSummary;
