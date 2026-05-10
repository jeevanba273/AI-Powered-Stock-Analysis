import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';

interface Commodity {
  commoditySymbol?: string;
  lastTradedPrice?: number | string;
  openingPrice?: number | string;
  highPrice?: number | string;
  lowPrice?: number | string;
  closingPrice?: number | string;
  totalVolume?: number | string;
  openInterest?: number | string;
  priceChange?: number | string;
  percentageChange?: number | string;
  expiryDate?: string;
  contractMonth?: string;
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
        if (Array.isArray(data)) {
          setCommodities(data);
        } else if (data && typeof data === 'object') {
          const arr = Object.values(data).find(v => Array.isArray(v));
          setCommodities(Array.isArray(arr) ? (arr as Commodity[]) : []);
        } else {
          setCommodities([]);
        }
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
                  const pctChange = Number(c.percentageChange);
                  const isUp = pctChange >= 0;
                  const changeColor = isNaN(pctChange)
                    ? 'var(--ns-text-2)'
                    : isUp
                      ? 'var(--ns-profit)'
                      : 'var(--ns-loss)';

                  return (
                    <tr key={i} style={{ borderBottom: '1px solid var(--ns-border)' }}>
                      <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 600 }}>
                        {c.commoditySymbol || '-'}
                      </td>
                      <td className="mono tnum" style={{ ...tdStyle, fontWeight: 600 }}>
                        {formatNum(c.lastTradedPrice)}
                      </td>
                      <td className="mono tnum" style={{ ...tdStyle, fontWeight: 600, color: changeColor }}>
                        {formatNum(c.priceChange)}
                      </td>
                      <td className="mono tnum" style={{ ...tdStyle, fontWeight: 600, color: changeColor }}>
                        {c.percentageChange !== undefined && c.percentageChange !== null && c.percentageChange !== ''
                          ? (Number(c.percentageChange) >= 0 ? '+' : '') + formatNum(c.percentageChange) + '%'
                          : '-'}
                      </td>
                      <td className="mono tnum" style={tdStyle}>{formatNum(c.openingPrice)}</td>
                      <td className="mono tnum" style={tdStyle}>{formatNum(c.highPrice)}</td>
                      <td className="mono tnum" style={tdStyle}>{formatNum(c.lowPrice)}</td>
                      <td className="mono tnum" style={tdStyle}>{formatNum(c.closingPrice)}</td>
                      <td className="mono tnum" style={tdStyle}>{formatVol(c.totalVolume)}</td>
                      <td className="mono tnum" style={tdStyle}>{formatVol(c.openInterest)}</td>
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
