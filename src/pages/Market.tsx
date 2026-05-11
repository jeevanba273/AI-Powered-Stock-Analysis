import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';

interface MarketStock {
  ticker_id?: string;
  company_name?: string;
  company?: string;
  ticker?: string;
  price: any;
  percent_change: any;
  net_change: any;
  volume: any;
  high?: any;
  low?: any;
  overall_rating?: string;
  short_term_trends?: string;
  long_term_trends?: string;
  short_term_trend?: string;
  long_term_trend?: string;
  year_low?: any;
  year_high?: any;
  '52_week_low'?: any;
  '52_week_high'?: any;
}

const Market: React.FC = () => {
  const navigate = useNavigate();
  const [trending, setTrending] = useState<{ top_gainers: MarketStock[]; top_losers: MarketStock[] } | null>(null);
  const [mostActive, setMostActive] = useState<MarketStock[]>([]);
  const [bseActive, setBseActive] = useState<MarketStock[]>([]);
  const [shockers, setShockers] = useState<any>(null);
  const [week52, setWeek52] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const handleSelectStock = (ticker: string) => navigate(`/stock/${ticker}`);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [trendRes, activeRes, bseRes, shockerRes, w52Res] = await Promise.allSettled([
          fetch('/api/proxy/dev/trending').then(r => r.json()),
          fetch('/api/proxy/dev/NSE_most_active').then(r => r.json()),
          fetch('/api/proxy/dev/BSE_most_active').then(r => r.json()),
          fetch('/api/proxy/dev/price_shockers').then(r => r.json()),
          fetch('/api/proxy/dev/fetch_52_week_high_low_data').then(r => r.json()),
        ]);

        if (trendRes.status === 'fulfilled' && trendRes.value?.trending_stocks) {
          setTrending(trendRes.value.trending_stocks);
        }
        if (activeRes.status === 'fulfilled' && Array.isArray(activeRes.value)) {
          setMostActive(activeRes.value.slice(0, 10));
        }
        if (bseRes.status === 'fulfilled' && Array.isArray(bseRes.value)) {
          setBseActive(bseRes.value.slice(0, 10));
        }
        if (shockerRes.status === 'fulfilled') {
          setShockers(shockerRes.value);
        }
        if (w52Res.status === 'fulfilled') {
          setWeek52(w52Res.value);
        }
      } catch (err) {
        console.error('[Market] Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const formatPrice = (v: any) => Number(v).toFixed(2);
  const formatPct = (v: any) => {
    const n = Number(v);
    return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
  };
  const formatVol = (v: any) => {
    const n = Number(v);
    if (n >= 1e7) return (n / 1e7).toFixed(2) + 'Cr';
    if (n >= 1e5) return (n / 1e5).toFixed(2) + 'L';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return n.toString();
  };

  const thStyle: React.CSSProperties = { textAlign: 'right', padding: '8px 10px', color: 'var(--ns-text-3)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' };
  const thLeftStyle: React.CSSProperties = { ...thStyle, textAlign: 'left' };

  const getTrendColor = (rating?: string) => {
    if (!rating) return undefined;
    const r = rating.toLowerCase();
    if (r === 'bullish') return 'var(--ns-profit)';
    if (r === 'bearish') return 'var(--ns-loss)';
    return undefined;
  };

  const StockTable: React.FC<{ stocks: MarketStock[]; title: string; icon: React.ReactNode; showTrend?: boolean; show52WRange?: boolean }> = ({ stocks, title, icon, showTrend, show52WRange }) => (
    <div className="ns-card" style={{ padding: 18 }}>
      <div className="ns-card-header">
        <div className="ns-card-title">{icon} {title}</div>
        <div style={{ fontSize: 10.5, color: 'var(--ns-text-4)' }}>{stocks.length} stocks</div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--ns-border)' }}>
              <th style={thLeftStyle}>Stock</th>
              <th style={thStyle}>Price</th>
              <th style={thStyle}>Change</th>
              <th style={thStyle}>Volume</th>
              {showTrend && <th style={thStyle}>Trend</th>}
              {show52WRange && <th style={thStyle}>52W Range</th>}
            </tr>
          </thead>
          <tbody>
            {stocks.map((s, i) => {
              const name = s.company_name || s.company || '';
              const pct = Number(s.percent_change);
              const isUp = pct >= 0;
              const rating = s.overall_rating;
              const weekLow = s['52_week_low'] ?? s.year_low;
              const weekHigh = s['52_week_high'] ?? s.year_high;
              return (
                <tr key={i} style={{ borderBottom: '1px solid var(--ns-border)' }}>
                  <td style={{ padding: '10px 10px' }}>
                    <div style={{ fontWeight: 600 }}>{name.length > 25 ? name.slice(0, 25) + '...' : name}</div>
                  </td>
                  <td className="mono tnum" style={{ textAlign: 'right', padding: '10px 10px', fontWeight: 600 }}>₹{formatPrice(s.price)}</td>
                  <td className="mono tnum" style={{ textAlign: 'right', padding: '10px 10px', fontWeight: 600, color: isUp ? 'var(--ns-profit)' : 'var(--ns-loss)' }}>
                    {formatPct(s.percent_change)}
                  </td>
                  <td className="mono tnum" style={{ textAlign: 'right', padding: '10px 10px', color: 'var(--ns-text-2)' }}>
                    {formatVol(s.volume)}
                  </td>
                  {showTrend && (
                    <td style={{ textAlign: 'right', padding: '10px 10px', fontSize: 11, fontWeight: 600, color: getTrendColor(rating) }}>
                      {rating || '—'}
                    </td>
                  )}
                  {show52WRange && weekLow != null && weekHigh != null ? (
                    <td className="mono tnum" style={{ textAlign: 'right', padding: '10px 10px', fontSize: 11, color: 'var(--ns-text-2)' }}>
                      {formatPrice(weekLow)} – {formatPrice(weekHigh)}
                    </td>
                  ) : show52WRange ? (
                    <td style={{ textAlign: 'right', padding: '10px 10px', fontSize: 11, color: 'var(--ns-text-4)' }}>—</td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {stocks.length === 0 && !loading && (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--ns-text-3)', fontSize: 13 }}>
          No data available — market may be closed.
        </div>
      )}
    </div>
  );

  const TableSkeleton = () => (
    <div className="ns-card" style={{ padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <div className="ns-skeleton" style={{ width: 120, height: 12 }} />
        <div className="ns-skeleton" style={{ width: 60, height: 12 }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: 0 }}>
        {/* Header row */}
        <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--ns-border)' }}><div className="ns-skeleton" style={{ width: 40, height: 10 }} /></div>
        <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--ns-border)' }}><div className="ns-skeleton" style={{ width: 40, height: 10, marginLeft: 'auto' }} /></div>
        <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--ns-border)' }}><div className="ns-skeleton" style={{ width: 50, height: 10, marginLeft: 'auto' }} /></div>
        <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--ns-border)' }}><div className="ns-skeleton" style={{ width: 50, height: 10, marginLeft: 'auto' }} /></div>
        {/* Data rows */}
        {[1,2,3,4,5,6,7,8].map(i => (
          <React.Fragment key={i}>
            <div style={{ padding: '10px 10px', borderBottom: '1px solid var(--ns-border)' }}><div className="ns-skeleton" style={{ width: `${60 + (i % 3) * 15}%`, height: 13 }} /></div>
            <div style={{ padding: '10px 10px', borderBottom: '1px solid var(--ns-border)' }}><div className="ns-skeleton" style={{ width: 55, height: 13, marginLeft: 'auto' }} /></div>
            <div style={{ padding: '10px 10px', borderBottom: '1px solid var(--ns-border)' }}><div className="ns-skeleton" style={{ width: 50, height: 13, marginLeft: 'auto' }} /></div>
            <div style={{ padding: '10px 10px', borderBottom: '1px solid var(--ns-border)' }}><div className="ns-skeleton" style={{ width: 45, height: 13, marginLeft: 'auto' }} /></div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  // --- Heatmap Component ---
  const Heatmap: React.FC<{ stocks: MarketStock[] }> = ({ stocks }) => {
    if (stocks.length === 0) return null;

    const getHeatColor = (pct: number): string => {
      if (pct > 2) return '#0AD88F';
      if (pct > 0.5) return '#4ADE80';
      if (pct >= -0.5) return '#6B7280';
      if (pct >= -2) return '#F87171';
      return '#FF5353';
    };

    const getTextColor = (pct: number): string => {
      if (pct > 0.5) return '#fff';
      if (pct >= -0.5) return '#fff';
      return '#fff';
    };

    // Sort by absolute volume descending, assign flex-grow based on volume rank
    const sorted = [...stocks].sort((a, b) => Math.abs(Number(b.volume) || 0) - Math.abs(Number(a.volume) || 0));
    const maxVol = Math.max(...sorted.map(s => Number(s.volume) || 1));

    return (
      <div className="ns-card" style={{ padding: 18 }}>
        <div className="ns-card-header">
          <div>
            <div className="ns-card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Activity size={14} /> Market Heatmap
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--ns-text-4)', marginTop: 2 }}>Top gainers and losers by volume</div>
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--ns-text-4)' }}>{sorted.length} stocks</div>
        </div>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 3,
          marginTop: 8,
        }}>
          {sorted.map((s, i) => {
            const pct = Number(s.percent_change) || 0;
            const vol = Number(s.volume) || 1;
            const name = s.company_name || s.company || '';
            const ticker = s.ticker_id || s.ticker || name.slice(0, 6);
            // flex-grow proportional to volume, min 1
            const grow = Math.max(1, Math.round((vol / maxVol) * 6));
            return (
              <div
                key={i}
                style={{
                  flexGrow: grow,
                  flexBasis: 0,
                  minWidth: 90,
                  maxWidth: '100%',
                  background: getHeatColor(pct),
                  color: getTextColor(pct),
                  borderRadius: 8,
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 2,
                  cursor: 'default',
                  transition: 'opacity 0.15s',
                  opacity: 0.92,
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.92')}
              >
                <div style={{ fontWeight: 700, fontSize: 12.5, letterSpacing: '0.02em', textAlign: 'center', lineHeight: 1.2 }}>
                  {ticker.length > 12 ? ticker.slice(0, 12) : ticker}
                </div>
                <div className="mono tnum" style={{ fontSize: 11.5, fontWeight: 600 }}>
                  ₹{formatPrice(s.price)}
                </div>
                <div className="mono tnum" style={{ fontSize: 10.5, fontWeight: 600 }}>
                  {formatPct(s.percent_change)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const heatmapStocks: MarketStock[] = [
    ...(trending?.top_gainers || []),
    ...(trending?.top_losers || []),
  ];

  const content = loading ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="ns-fade-up">
        <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>Market Overview</h1>
        <p style={{ fontSize: 13, color: 'var(--ns-text-3)', marginTop: 4 }}>Loading market data...</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <TableSkeleton />
        <TableSkeleton />
      </div>
      <TableSkeleton />
    </div>
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="ns-fade-up">
        <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>Market Overview</h1>
        <p style={{ fontSize: 13, color: 'var(--ns-text-3)', marginTop: 4 }}>Live market pulse — gainers, losers, and most active stocks</p>
      </div>

      {/* Market Heatmap */}
      {heatmapStocks.length > 0 && <Heatmap stocks={heatmapStocks} />}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <StockTable
          stocks={trending?.top_gainers?.slice(0, 10) || []}
          title="Top Gainers"
          icon={<TrendingUp size={14} style={{ color: 'var(--ns-profit)' }} />}
          showTrend
        />
        <StockTable
          stocks={trending?.top_losers?.slice(0, 10) || []}
          title="Top Losers"
          icon={<TrendingDown size={14} style={{ color: 'var(--ns-loss)' }} />}
          showTrend
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <StockTable
          stocks={mostActive}
          title="Most Active (NSE)"
          icon={<Activity size={14} />}
          showTrend
          show52WRange
        />
        <StockTable
          stocks={bseActive}
          title="Most Active (BSE)"
          icon={<Activity size={14} />}
          showTrend
          show52WRange
        />
      </div>

      {/* Price Shockers */}
      {shockers && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {shockers.NSE_PriceShocker && (
            <div className="ns-card" style={{ padding: 18 }}>
              <div className="ns-card-header">
                <div className="ns-card-title"><TrendingDown size={14} style={{ color: 'var(--ns-loss)' }} /> NSE Price Shockers</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(Array.isArray(shockers.NSE_PriceShocker) ? shockers.NSE_PriceShocker : []).slice(0, 8).map((s: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 8, background: 'var(--ns-surface)', border: '1px solid var(--ns-border)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600 }}>{s.displayName?.slice(0, 25) || s.company || 'N/A'}</span>
                        {s.overallRating && (
                          <span style={{ fontSize: 9.5, fontWeight: 600, padding: '1px 6px', borderRadius: 4, color: '#fff', background: s.overallRating.toLowerCase() === 'bullish' ? 'var(--ns-profit)' : s.overallRating.toLowerCase() === 'bearish' ? 'var(--ns-loss)' : 'var(--ns-text-3)' }}>
                            {s.overallRating}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 10.5, color: 'var(--ns-text-4)' }}>
                        Deviation: {Number(s.deviation || 0).toFixed(1)}%
                        {s.marketCap != null && <span style={{ marginLeft: 8 }}>MCap: {Number(s.marketCap).toLocaleString('en-IN')}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="mono tnum" style={{ fontSize: 12.5, fontWeight: 600 }}>₹{Number(s.price).toFixed(2)}</div>
                      <div className="mono" style={{ fontSize: 11, color: Number(s.percentChange) >= 0 ? 'var(--ns-profit)' : 'var(--ns-loss)' }}>
                        {Number(s.percentChange) >= 0 ? '+' : ''}{Number(s.percentChange).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {shockers.BSE_PriceShocker && (
            <div className="ns-card" style={{ padding: 18 }}>
              <div className="ns-card-header">
                <div className="ns-card-title"><TrendingDown size={14} style={{ color: 'var(--ns-loss)' }} /> BSE Price Shockers</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(Array.isArray(shockers.BSE_PriceShocker) ? shockers.BSE_PriceShocker : []).slice(0, 8).map((s: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 8, background: 'var(--ns-surface)', border: '1px solid var(--ns-border)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600 }}>{s.displayName?.slice(0, 25) || s.company || 'N/A'}</span>
                        {s.overallRating && (
                          <span style={{ fontSize: 9.5, fontWeight: 600, padding: '1px 6px', borderRadius: 4, color: '#fff', background: s.overallRating.toLowerCase() === 'bullish' ? 'var(--ns-profit)' : s.overallRating.toLowerCase() === 'bearish' ? 'var(--ns-loss)' : 'var(--ns-text-3)' }}>
                            {s.overallRating}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 10.5, color: 'var(--ns-text-4)' }}>
                        Deviation: {Number(s.deviation || 0).toFixed(1)}%
                        {s.marketCap != null && <span style={{ marginLeft: 8 }}>MCap: {Number(s.marketCap).toLocaleString('en-IN')}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="mono tnum" style={{ fontSize: 12.5, fontWeight: 600 }}>₹{Number(s.price).toFixed(2)}</div>
                      <div className="mono" style={{ fontSize: 11, color: Number(s.percentChange) >= 0 ? 'var(--ns-profit)' : 'var(--ns-loss)' }}>
                        {Number(s.percentChange) >= 0 ? '+' : ''}{Number(s.percentChange).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 52-Week High/Low */}
      {week52 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {['NSE', 'BSE'].map(exch => {
            const key = `${exch}_52WeekHighLow`;
            const data = week52[key];
            if (!data) return null;
            return (
              <div key={exch} className="ns-card" style={{ padding: 18 }}>
                <div className="ns-card-header">
                  <div className="ns-card-title">{exch} 52-Week Extremes</div>
                </div>
                {data.high52Week && data.high52Week.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: 'var(--ns-profit)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>New 52W Highs</div>
                    {data.high52Week.slice(0, 5).map((s: any, i: number) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--ns-border)', fontSize: 12 }}>
                        <span style={{ fontWeight: 600 }}>{s.company?.slice(0, 25) || 'N/A'}</span>
                        <span className="mono tnum" style={{ color: 'var(--ns-profit)' }}>₹{Number(s.price || s['52_week_high'] || 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {data.low52Week && data.low52Week.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--ns-loss)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>New 52W Lows</div>
                    {data.low52Week.slice(0, 5).map((s: any, i: number) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--ns-border)', fontSize: 12 }}>
                        <span style={{ fontWeight: 600 }}>{s.company?.slice(0, 25) || 'N/A'}</span>
                        <span className="mono tnum" style={{ color: 'var(--ns-loss)' }}>₹{Number(s.price || s['52_week_low'] || 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {(!data.high52Week?.length && !data.low52Week?.length) && (
                  <div style={{ padding: 16, textAlign: 'center', color: 'var(--ns-text-3)', fontSize: 13 }}>No data — market may be closed</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="ns-app">
      <Sidebar activeStock="" onSelectStock={handleSelectStock} />
      <main className="ns-main">
        <TopBar onSelectStock={handleSelectStock} />
        <div className="ns-content">{content}</div>
      </main>
    </div>
  );
};

export default Market;
