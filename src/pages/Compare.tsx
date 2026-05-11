import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftRight, Search, X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';

interface StockEntry {
  id: string;
  name: string;
  'bse-code': string;
  'nse-code': string;
}

interface CompareStock {
  ticker: string;
  name: string;
  price: number;
  changePct: number;
  pe: number;
  marketCap: string;
  roe: number;
  dividend: string;
  bookValue: number;
  debtToEquity: number;
  loading: boolean;
}

let cachedCatalog: StockEntry[] = [];

const Compare: React.FC = () => {
  const navigate = useNavigate();
  const handleSelectStock = (ticker: string) => navigate(`/stock/${ticker}`);

  const [stocks, setStocks] = useState<CompareStock[]>([]);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [filtered, setFiltered] = useState<StockEntry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load catalog
  useEffect(() => {
    if (cachedCatalog.length > 0) return;
    fetch('/api/stocks/catalog')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          cachedCatalog = data;
          console.log(`[Compare] Loaded ${data.length} stocks from catalog`);
        }
      })
      .catch(err => console.error('[Compare] Failed to load catalog:', err));
  }, []);

  // Filter catalog on query change
  useEffect(() => {
    if (query.trim().length > 0) {
      const q = query.toLowerCase();
      const results = cachedCatalog.filter(s =>
        s.name.toLowerCase().includes(q) ||
        (s['nse-code'] && s['nse-code'].toLowerCase().includes(q)) ||
        (s['bse-code'] && s['bse-code'].toLowerCase().includes(q))
      ).slice(0, 8);
      setFiltered(results);
      setSearchOpen(results.length > 0);
    } else {
      setFiltered([]);
      setSearchOpen(false);
    }
  }, [query]);

  const fetchStockData = async (ticker: string, name: string) => {
    // Add placeholder immediately
    const placeholder: CompareStock = {
      ticker,
      name,
      price: 0,
      changePct: 0,
      pe: 0,
      marketCap: '--',
      roe: 0,
      dividend: '--',
      bookValue: 0,
      debtToEquity: 0,
      loading: true,
    };
    setStocks(prev => [...prev, placeholder]);

    try {
      // Fetch price and details in parallel
      const [priceRes, detailsRes] = await Promise.all([
        fetch('/api/proxy/dev/nse_stock_batch_live_price', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stock_symbols: [ticker] }),
        }).then(r => r.json()),
        fetch(`/api/proxy/dev/get_stock_data?stock_name=${ticker}`).then(r => r.json()),
      ]);

      const liveData = priceRes?.[ticker];
      const stats = detailsRes?.stats || {};

      const pe = typeof stats.peRatio === 'number' ? stats.peRatio : 0;
      const divYield = typeof stats.divYield === 'number' ? `${stats.divYield.toFixed(2)}%` : '0%';
      const mCap = typeof stats.marketCap === 'number'
        ? `₹${stats.marketCap.toFixed(2)}Cr`
        : '--';
      const roe = typeof stats.roe === 'number' ? stats.roe : 0;
      const bv = typeof stats.bookValue === 'number' ? stats.bookValue : 0;
      const dte = typeof stats.debtToEquity === 'number' ? stats.debtToEquity : 0;

      setStocks(prev =>
        prev.map(s =>
          s.ticker === ticker
            ? {
                ...s,
                price: liveData?.ltp ?? 0,
                changePct: liveData?.day_change_percent ?? 0,
                pe,
                marketCap: mCap,
                roe,
                dividend: divYield,
                bookValue: bv,
                debtToEquity: dte,
                name: detailsRes?.name || name,
                loading: false,
              }
            : s
        )
      );
    } catch (err) {
      console.error(`[Compare] Failed to fetch ${ticker}:`, err);
      setStocks(prev =>
        prev.map(s => (s.ticker === ticker ? { ...s, loading: false } : s))
      );
    }
  };

  const handleAdd = (stock: StockEntry) => {
    const ticker = stock['nse-code'] || stock['bse-code'];
    if (stocks.length >= 3) return;
    if (stocks.some(s => s.ticker === ticker)) return;
    setQuery('');
    setSearchOpen(false);
    fetchStockData(ticker, stock.name);
  };

  const handleRemove = (ticker: string) => {
    setStocks(prev => prev.filter(s => s.ticker !== ticker));
  };

  // Helpers
  const formatPrice = (v: number) => v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatPct = (v: number) => (v >= 0 ? '+' : '') + v.toFixed(2) + '%';

  // Find best values for highlighting
  const loadedStocks = stocks.filter(s => !s.loading);
  const bestPE = loadedStocks.length > 1
    ? loadedStocks.filter(s => s.pe > 0).sort((a, b) => a.pe - b.pe)[0]?.ticker
    : null;
  const bestROE = loadedStocks.length > 1
    ? loadedStocks.filter(s => s.roe > 0).sort((a, b) => b.roe - a.roe)[0]?.ticker
    : null;
  const bestDiv = loadedStocks.length > 1
    ? loadedStocks.filter(s => parseFloat(s.dividend) > 0).sort((a, b) => parseFloat(b.dividend) - parseFloat(a.dividend))[0]?.ticker
    : null;

  const highlightStyle = (ticker: string, bestTicker: string | null): React.CSSProperties =>
    ticker === bestTicker
      ? { background: 'rgba(10, 216, 143, 0.12)', borderRadius: 4, padding: '2px 6px' }
      : {};

  const metrics: { label: string; key: keyof CompareStock; format: (s: CompareStock) => string; best?: string | null }[] = [
    { label: 'Price', key: 'price', format: s => `₹${formatPrice(s.price)}` },
    { label: 'Change %', key: 'changePct', format: s => formatPct(s.changePct) },
    { label: 'P/E Ratio', key: 'pe', format: s => s.pe > 0 ? s.pe.toFixed(2) : '--', best: bestPE },
    { label: 'Market Cap', key: 'marketCap', format: s => s.marketCap },
    { label: 'ROE', key: 'roe', format: s => s.roe > 0 ? `${s.roe.toFixed(2)}%` : '--', best: bestROE },
    { label: 'Dividend Yield', key: 'dividend', format: s => s.dividend, best: bestDiv },
    { label: 'Book Value', key: 'bookValue', format: s => s.bookValue > 0 ? `₹${s.bookValue.toFixed(2)}` : '--' },
    { label: 'Debt/Equity', key: 'debtToEquity', format: s => s.debtToEquity > 0 ? s.debtToEquity.toFixed(2) : '--' },
  ];

  return (
    <div className="ns-app">
      <Sidebar activeStock="" onSelectStock={handleSelectStock} />
      <main className="ns-main">
        <TopBar onSelectStock={handleSelectStock} />
        <div className="ns-content">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="ns-fade-up">
              <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>Stock Comparison</h1>
              <p style={{ fontSize: 13, color: 'var(--ns-text-3)', marginTop: 4 }}>Compare up to 3 stocks side by side</p>
            </div>

            {/* Search to add stocks */}
            {stocks.length < 3 && (
              <div className="ns-card" style={{ padding: 18 }}>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'var(--ns-surface)',
                    border: '1px solid var(--ns-border)',
                    borderRadius: 10,
                    padding: '8px 14px',
                  }}>
                    <Search size={16} style={{ color: 'var(--ns-text-3)', flexShrink: 0 }} />
                    <input
                      ref={inputRef}
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      onFocus={() => { if (query.trim() && filtered.length > 0) setSearchOpen(true); }}
                      onBlur={() => setTimeout(() => setSearchOpen(false), 180)}
                      placeholder={`Add a stock to compare (${3 - stocks.length} remaining)...`}
                      autoComplete="off"
                      style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: 'var(--ns-text-1)',
                        fontSize: 13,
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>
                  {searchOpen && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: 4,
                      background: 'var(--ns-card)',
                      border: '1px solid var(--ns-border)',
                      borderRadius: 12,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                      zIndex: 50,
                      maxHeight: 300,
                      overflowY: 'auto',
                    }}>
                      {filtered.map(stock => {
                        const ticker = stock['nse-code'] || stock['bse-code'];
                        const alreadyAdded = stocks.some(s => s.ticker === ticker);
                        return (
                          <div
                            key={stock.id}
                            onMouseDown={() => !alreadyAdded && handleAdd(stock)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              padding: '10px 14px',
                              cursor: alreadyAdded ? 'default' : 'pointer',
                              opacity: alreadyAdded ? 0.4 : 1,
                              borderBottom: '1px solid var(--ns-border)',
                              transition: 'background 0.1s',
                            }}
                            onMouseEnter={e => { if (!alreadyAdded) e.currentTarget.style.background = 'var(--ns-surface)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                          >
                            <div style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: 'var(--ns-accent)',
                              display: 'grid',
                              placeItems: 'center',
                              color: '#fff',
                              fontSize: 11,
                              fontWeight: 700,
                              flexShrink: 0,
                            }}>
                              {ticker.slice(0, 3)}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>
                                {ticker}
                                <span style={{ color: 'var(--ns-text-4)', fontWeight: 400, fontSize: 10.5, marginLeft: 4 }}>
                                  {stock['nse-code'] ? 'NSE' : 'BSE'}
                                </span>
                              </div>
                              <div style={{ fontSize: 12, color: 'var(--ns-text-3)' }}>{stock.name}</div>
                            </div>
                            {alreadyAdded && (
                              <span style={{ fontSize: 10.5, color: 'var(--ns-text-4)', fontWeight: 600 }}>Added</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Empty state */}
            {stocks.length === 0 && (
              <div className="ns-card" style={{
                padding: 48,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
              }}>
                <ArrowLeftRight size={32} style={{ color: 'var(--ns-text-4)' }} />
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ns-text-2)' }}>Add stocks to compare</div>
                <div style={{ fontSize: 12.5, color: 'var(--ns-text-3)' }}>Search and add up to 3 stocks using the search box above</div>
              </div>
            )}

            {/* Selected stocks chips */}
            {stocks.length > 0 && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {stocks.map(s => (
                  <div
                    key={s.ticker}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      background: 'var(--ns-card)',
                      border: '1px solid var(--ns-border)',
                      borderRadius: 10,
                      padding: '8px 14px',
                    }}
                  >
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: 'var(--ns-accent)',
                      display: 'grid',
                      placeItems: 'center',
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 700,
                    }}>
                      {s.ticker.slice(0, 3)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 12.5 }}>{s.ticker}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--ns-text-3)' }}>
                        {s.name.length > 20 ? s.name.slice(0, 20) + '...' : s.name}
                      </div>
                    </div>
                    {s.loading ? (
                      <div className="ns-skeleton" style={{ width: 14, height: 14, borderRadius: '50%', marginLeft: 4 }} />
                    ) : (
                      <button
                        onClick={() => handleRemove(s.ticker)}
                        style={{
                          marginLeft: 4,
                          background: 'var(--ns-surface)',
                          border: '1px solid var(--ns-border)',
                          borderRadius: 6,
                          width: 24,
                          height: 24,
                          display: 'grid',
                          placeItems: 'center',
                          cursor: 'pointer',
                          color: 'var(--ns-text-3)',
                          transition: 'color 0.15s',
                        }}
                        title="Remove"
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--ns-loss)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--ns-text-3)')}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Comparison table */}
            {loadedStocks.length > 0 && (
              <div className="ns-card" style={{ padding: 18 }}>
                <div className="ns-card-header" style={{ marginBottom: 12 }}>
                  <div className="ns-card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ArrowLeftRight size={14} /> Price Comparison
                  </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--ns-border)' }}>
                        <th style={{
                          textAlign: 'left',
                          padding: '8px 10px',
                          color: 'var(--ns-text-3)',
                          fontSize: 10.5,
                          fontWeight: 600,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                        }}>
                          Metric
                        </th>
                        {loadedStocks.map(s => (
                          <th key={s.ticker} style={{
                            textAlign: 'right',
                            padding: '8px 10px',
                            color: 'var(--ns-text-1)',
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: '0.03em',
                          }}>
                            {s.ticker}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.map(m => (
                        <tr key={m.label} style={{ borderBottom: '1px solid var(--ns-border)' }}>
                          <td style={{
                            padding: '10px 10px',
                            fontSize: 12,
                            fontWeight: 600,
                            color: 'var(--ns-text-2)',
                          }}>
                            {m.label}
                          </td>
                          {loadedStocks.map(s => {
                            const isChangePct = m.key === 'changePct';
                            const val = m.format(s);
                            return (
                              <td
                                key={s.ticker}
                                className="mono tnum"
                                style={{
                                  textAlign: 'right',
                                  padding: '10px 10px',
                                  fontWeight: 600,
                                  color: isChangePct
                                    ? s.changePct >= 0 ? 'var(--ns-profit)' : 'var(--ns-loss)'
                                    : 'var(--ns-text-1)',
                                }}
                              >
                                <span style={highlightStyle(s.ticker, m.best || null)}>
                                  {isChangePct && s.changePct > 0 && <TrendingUp size={11} style={{ marginRight: 3, verticalAlign: 'middle' }} />}
                                  {isChangePct && s.changePct < 0 && <TrendingDown size={11} style={{ marginRight: 3, verticalAlign: 'middle' }} />}
                                  {isChangePct && s.changePct === 0 && <Minus size={11} style={{ marginRight: 3, verticalAlign: 'middle' }} />}
                                  {val}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Compare;
