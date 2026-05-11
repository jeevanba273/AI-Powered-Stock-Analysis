import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';

interface Commodity {
  product?: string;
  expiry?: string;
  last_traded_price?: string;
  last_traded_quantity?: string;
  average_traded_price?: string;
  total_quantity_traded?: string;
  open_interest?: string;
  open_price?: string;
  high_price?: string;
  low_price?: string;
  closing_price?: string;
  buy_price?: string;
  sell_price?: string;
}

const Commodities: React.FC = () => {
  const navigate = useNavigate();
  const handleSelectStock = (ticker: string) => navigate('/stock/' + ticker);

  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCommodities = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/proxy/dev/commodities');
        const data = await res.json();
        let arr: Commodity[] = [];
        if (Array.isArray(data)) {
          arr = data;
        } else if (data && typeof data === 'object') {
          const found = Object.values(data).find(v => Array.isArray(v));
          arr = Array.isArray(found) ? (found as Commodity[]) : [];
        }
        // Filter out entries where last_traded_price is 0 or "0.00"
        arr = arr.filter(c => {
          const ltp = Number(c.last_traded_price);
          return !isNaN(ltp) && ltp !== 0;
        });
        setCommodities(arr);
      } catch (err) {
        console.error('[Commodities] Fetch error:', err);
        setError('Failed to load commodity data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchCommodities();
  }, []);

  const formatNum = (v: number | string | undefined, decimals = 2): string => {
    if (v === undefined || v === null || v === '') return '-';
    const n = Number(v);
    return isNaN(n) ? String(v) : n.toFixed(decimals);
  };

  const formatVol = (v: number | string | undefined): string => {
    if (v === undefined || v === null || v === '') return '-';
    const n = Number(v);
    if (isNaN(n)) return String(v);
    if (n >= 1e7) return (n / 1e7).toFixed(2) + 'Cr';
    if (n >= 1e5) return (n / 1e5).toFixed(2) + 'L';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return n.toLocaleString();
  };

  const thStyle: React.CSSProperties = {
    textAlign: 'right',
    padding: '8px 10px',
    color: 'var(--ns-text-3)',
    fontSize: 10.5,
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  };

  const tdStyle: React.CSSProperties = {
    textAlign: 'right',
    padding: '10px 10px',
    fontSize: 12.5,
    whiteSpace: 'nowrap',
  };

  const TableSkeleton = () => (
    <div className="ns-card" style={{ padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <div className="ns-skeleton" style={{ width: 160, height: 12 }} />
        <div className="ns-skeleton" style={{ width: 70, height: 12 }} />
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--ns-border)' }}>
              {Array.from({ length: 10 }).map((_, i) => (
                <th key={i} style={{ padding: '8px 10px', borderBottom: '1px solid var(--ns-border)' }}>
                  <div className="ns-skeleton" style={{ width: 50, height: 10, marginLeft: i === 0 ? 0 : 'auto' }} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, row) => (
              <tr key={row} style={{ borderBottom: '1px solid var(--ns-border)' }}>
                {Array.from({ length: 10 }).map((_, col) => (
                  <td key={col} style={{ padding: '10px 10px' }}>
                    <div
                      className="ns-skeleton"
                      style={{
                        width: col === 0 ? `${70 + (row % 3) * 10}%` : 55,
                        height: 13,
                        marginLeft: col === 0 ? 0 : 'auto',
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const content = loading ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="ns-fade-up">
        <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>Commodities</h1>
        <p style={{ fontSize: 13, color: 'var(--ns-text-3)', marginTop: 4 }}>Loading commodity data...</p>
      </div>
      <TableSkeleton />
    </div>
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="ns-fade-up">
        <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>Commodities</h1>
        <p style={{ fontSize: 13, color: 'var(--ns-text-3)', marginTop: 4 }}>
          MCX Futures &mdash; Gold, Silver, Crude Oil &amp; more
        </p>
      </div>

      {error && (
        <div className="ns-card" style={{ padding: 24, textAlign: 'center', color: 'var(--ns-loss)', fontSize: 13 }}>
          {error}
        </div>
      )}

      {!error && (
        <div className="ns-card" style={{ padding: 18 }}>
          <div className="ns-card-header">
            <div className="ns-card-title">
              <ShoppingCart size={14} /> MCX Commodities
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--ns-text-4)' }}>
              {commodities.length} contracts
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--ns-border)' }}>
                  <th style={{ ...thStyle, textAlign: 'left' }}>Symbol</th>
                  <th style={thStyle}>Expiry</th>
                  <th style={thStyle}>Last Price</th>
                  <th style={thStyle}>Change</th>
                  <th style={thStyle}>Change%</th>
                  <th style={thStyle}>Open</th>
                  <th style={thStyle}>High</th>
                  <th style={thStyle}>Low</th>
                  <th style={thStyle}>Close</th>
                  <th style={thStyle}>Volume</th>
                  <th style={thStyle}>Open Interest</th>
                </tr>
              </thead>
              <tbody>
                {commodities.map((c, i) => {
                  const priceChange = Number(c.change) || 0;
                  const pctChange = Number(c.per_change) || 0;
                  const isUp = priceChange >= 0;
                  const changeColor = isUp ? 'var(--ns-profit)' : 'var(--ns-loss)';

                  return (
                    <tr key={i} style={{ borderBottom: '1px solid var(--ns-border)' }}>
                      <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 600 }}>
                        {c.product || '-'}
                      </td>
                      <td style={{ ...tdStyle, fontSize: 11, color: 'var(--ns-text-3)' }}>
                        {c.expiry || '-'}
                      </td>
                      <td className="mono tnum" style={{ ...tdStyle, fontWeight: 600 }}>
                        {formatNum(c.last_traded_price)}
                      </td>
                      <td className="mono tnum" style={{ ...tdStyle, fontWeight: 600, color: changeColor }}>
                        {!isNaN(priceChange) ? (priceChange >= 0 ? '+' : '') + priceChange.toFixed(2) : '-'}
                      </td>
                      <td className="mono tnum" style={{ ...tdStyle, fontWeight: 600, color: changeColor }}>
                        {!isNaN(pctChange) ? (pctChange >= 0 ? '+' : '') + pctChange.toFixed(2) + '%' : '-'}
                      </td>
                      <td className="mono tnum" style={tdStyle}>{formatNum(c.open_price)}</td>
                      <td className="mono tnum" style={tdStyle}>{formatNum(c.high_price)}</td>
                      <td className="mono tnum" style={tdStyle}>{formatNum(c.low_price)}</td>
                      <td className="mono tnum" style={tdStyle}>{formatNum(c.closing_price)}</td>
                      <td className="mono tnum" style={tdStyle}>{formatVol(c.total_quantity_traded)}</td>
                      <td className="mono tnum" style={tdStyle}>{formatVol(c.open_interest)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {commodities.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--ns-text-3)', fontSize: 13 }}>
              No commodity data available at the moment.
            </div>
          )}
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

export default Commodities;
