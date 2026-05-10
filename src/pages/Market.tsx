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

  const StockTable: React.FC<{ stocks: MarketStock[]; title: string; icon: React.ReactNode }> = ({ stocks, title, icon }) => (
    <div className="ns-card" style={{ padding: 18 }}>
      <div className="ns-card-header">
        <div className="ns-card-title">{icon} {title}</div>
        <div style={{ fontSize: 10.5, color: 'var(--ns-text-4)' }}>{stocks.length} stocks</div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--ns-border)' }}>
              <th style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--ns-text-3)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Stock</th>
              <th style={{ textAlign: 'right', padding: '8px 10px', color: 'var(--ns-text-3)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Price</th>
              <th style={{ textAlign: 'right', padding: '8px 10px', color: 'var(--ns-text-3)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Change</th>
              <th style={{ textAlign: 'right', padding: '8px 10px', color: 'var(--ns-text-3)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Volume</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((s, i) => {
              const name = s.company_name || s.company || '';
              const pct = Number(s.percent_change);
              const isUp = pct >= 0;
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <StockTable
          stocks={trending?.top_gainers?.slice(0, 10) || []}
          title="Top Gainers"
          icon={<TrendingUp size={14} style={{ color: 'var(--ns-profit)' }} />}
        />
        <StockTable
          stocks={trending?.top_losers?.slice(0, 10) || []}
          title="Top Losers"
          icon={<TrendingDown size={14} style={{ color: 'var(--ns-loss)' }} />}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <StockTable
          stocks={mostActive}
          title="Most Active (NSE)"
          icon={<Activity size={14} />}
        />
        <StockTable
          stocks={bseActive}
          title="Most Active (BSE)"
          icon={<Activity size={14} />}
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
                      <div style={{ fontSize: 12.5, fontWeight: 600 }}>{s.displayName?.slice(0, 25) || s.company || 'N/A'}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--ns-text-4)' }}>Deviation: {Number(s.deviation || 0).toFixed(1)}%</div>
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
                      <div style={{ fontSize: 12.5, fontWeight: 600 }}>{s.displayName?.slice(0, 25) || s.company || 'N/A'}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--ns-text-4)' }}>Deviation: {Number(s.deviation || 0).toFixed(1)}%</div>
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
