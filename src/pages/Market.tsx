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
  const [loading, setLoading] = useState(true);
  const handleSelectStock = (ticker: string) => navigate(`/stock/${ticker}`);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [trendRes, activeRes] = await Promise.allSettled([
          fetch('/api/proxy/dev/trending').then(r => r.json()),
          fetch('/api/proxy/dev/NSE_most_active').then(r => r.json()),
        ]);

        if (trendRes.status === 'fulfilled' && trendRes.value?.trending_stocks) {
          setTrending(trendRes.value.trending_stocks);
        }
        if (activeRes.status === 'fulfilled' && Array.isArray(activeRes.value)) {
          setMostActive(activeRes.value.slice(0, 10));
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
      <StockTable
        stocks={mostActive}
        title="Most Active (NSE)"
        icon={<Activity size={14} />}
      />
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
