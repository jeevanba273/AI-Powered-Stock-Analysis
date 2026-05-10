import React, { useState, useEffect } from 'react';
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

const n = (v: any) => Number(v) || 0;

const inr = (v: number) => v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatVolume = (v: number) => {
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(2) + 'B';
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(2) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(2) + 'K';
  return v.toLocaleString('en-IN');
};

const StockSummary: React.FC<StockSummaryProps> = ({
  ticker, companyName, price, change, changePercent, currency,
  marketStatus, lastUpdated, stats, className, stockDetails,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [quarterResults, setQuarterResults] = useState<Record<string, Record<string, number>> | null>(null);
  const [quarterLoading, setQuarterLoading] = useState(false);

  useEffect(() => {
    if (!dialogOpen) return;
    let cancelled = false;
    setQuarterLoading(true);
    const encoded = encodeURIComponent(ticker);
    fetch(`/api/proxy/dev/historical_stats?stock_name=${encoded}&stats=quarter_results`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!cancelled && data && typeof data === 'object') {
          setQuarterResults(data);
        }
      })
      .catch(err => console.error('[Financials] Failed to fetch quarter results:', err))
      .finally(() => { if (!cancelled) setQuarterLoading(false); });
    return () => { cancelled = true; };
  }, [dialogOpen, ticker]);

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
          <div className="ns-stat-label">Prev Close</div>
          <div className="ns-stat-val mono tnum">{currency}{inr(n(stats.prevClose || stats.close))}</div>
        </div>
        <div className="ns-stat">
          <div className="ns-stat-label">Open</div>
          <div className="ns-stat-val mono tnum">{currency}{inr(n(stats.open))}</div>
        </div>
        <div className="ns-stat">
          <div className="ns-stat-label">Day High</div>
          <div className="ns-stat-val mono tnum">{currency}{inr(n(stats.high))}</div>
        </div>
        <div className="ns-stat">
          <div className="ns-stat-label">Day Low</div>
          <div className="ns-stat-val mono tnum">{currency}{inr(n(stats.low))}</div>
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
          <div className="ns-stat-val mono tnum">{n(stats.pe).toFixed(2)}</div>
        </div>
        <div className="ns-stat">
          <div className="ns-stat-label">Dividend</div>
          <div className="ns-stat-val mono" style={{ fontSize: 13 }}>{stats.dividend}</div>
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
          <span className="mono">{currency}{inr(n(stats.low))}</span>
          <span className="mono">{currency}{inr(n(stats.high))}</span>
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
          <span className="mono">{currency}{inr(n(yearLow))}</span>
          <span className="mono">{currency}{inr(n(yearHigh))}</span>
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
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto" style={{ width: '90vw' }}>
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
                {quarterLoading ? (
                  <div style={{ background: 'var(--ns-surface)', border: '1px solid var(--ns-border)', borderRadius: 12, padding: 16 }}>
                    <div className="ns-skeleton" style={{ width: '40%', height: 14 }} />
                    <div className="ns-skeleton" style={{ width: '100%', height: 200, marginTop: 12, borderRadius: 8 }} />
                  </div>
                ) : quarterResults && Object.keys(quarterResults).length > 0 ? (
                  <div style={{ background: 'var(--ns-surface)', border: '1px solid var(--ns-border)', borderRadius: 12, padding: 16 }}>
                    <h3 style={{ fontWeight: 600, marginBottom: 12 }}>Quarterly Results (in Cr)</h3>
                    <div style={{ overflowX: 'auto', maxHeight: '50vh', overflowY: 'auto' }}>
                      {(() => {
                        const metrics = Object.keys(quarterResults);
                        const allPeriods = metrics.length > 0 ? Object.keys(quarterResults[metrics[0]]) : [];
                        const periods = allPeriods.slice(-8);
                        return (
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                            <thead>
                              <tr>
                                <th style={{
                                  textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid var(--ns-border)',
                                  fontSize: 10.5, color: 'var(--ns-text-3)', textTransform: 'uppercase',
                                  letterSpacing: '0.04em', fontWeight: 600, position: 'sticky', left: 0,
                                  background: 'var(--ns-surface)', minWidth: 130,
                                }}>Metric</th>
                                {periods.map(p => (
                                  <th key={p} style={{
                                    textAlign: 'right', padding: '8px 10px', borderBottom: '1px solid var(--ns-border)',
                                    fontSize: 10.5, color: 'var(--ns-text-3)', fontWeight: 600, whiteSpace: 'nowrap',
                                  }}>{p}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {metrics.map(metric => (
                                <tr key={metric}>
                                  <td style={{
                                    padding: '8px 10px', borderBottom: '1px solid var(--ns-border)',
                                    fontWeight: 600, color: 'var(--ns-text-2)', position: 'sticky', left: 0,
                                    background: 'var(--ns-surface)', whiteSpace: 'nowrap',
                                  }}>{metric}</td>
                                  {periods.map(p => (
                                    <td key={p} className="mono tnum" style={{
                                      textAlign: 'right', padding: '8px 10px',
                                      borderBottom: '1px solid var(--ns-border)', whiteSpace: 'nowrap',
                                    }}>
                                      {quarterResults[metric][p] != null
                                        ? Number(quarterResults[metric][p]).toLocaleString('en-IN')
                                        : '--'}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        );
                      })()}
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: 'var(--ns-text-3)' }}>No financial data available.</p>
                )}
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
