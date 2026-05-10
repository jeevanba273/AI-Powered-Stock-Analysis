import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';

interface StockTrends {
  shortTermTrends?: string;
  longTermTrends?: string;
  overallRating?: string;
}

interface ScreenerResult {
  id?: string;
  commonName?: string;
  mgIndustry?: string;
  mgSector?: string;
  stockType?: string;
  exchangeCodeBse?: string;
  exchangeCodeNsi?: string;
  activeStockTrends?: StockTrends;
}

const PRESETS = ['Software', 'Bank', 'Pharma', 'Automobile', 'Consumer', 'Oil'];

const Screener: React.FC = () => {
  const navigate = useNavigate();
  const handleSelectStock = (ticker: string) => navigate('/stock/' + ticker);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ScreenerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = (term: string) => {
    if (!term.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    fetch(`/api/proxy/dev/industry_search?query=${encodeURIComponent(term.trim())}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setResults(data);
        } else if (data && typeof data === 'object') {
          const arr = Object.values(data).find(v => Array.isArray(v));
          setResults(Array.isArray(arr) ? (arr as ScreenerResult[]) : []);
        } else {
          setResults([]);
        }
      })
      .catch(err => {
        console.error('[Screener] Search error:', err);
        setResults([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(query);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handlePreset = (preset: string) => {
    setQuery(preset);
  };

  const getTrendColor = (trend: string | undefined): string => {
    if (!trend) return 'var(--ns-text-3)';
    const lower = trend.toLowerCase();
    if (lower.includes('bullish') && !lower.includes('moderately')) return 'var(--ns-profit)';
    if (lower.includes('bearish') && !lower.includes('moderately')) return 'var(--ns-loss)';
    if (lower.includes('moderately')) return '#e5a800';
    return 'var(--ns-text-3)';
  };

  const getTrendBg = (trend: string | undefined): string => {
    if (!trend) return 'var(--ns-surface)';
    const lower = trend.toLowerCase();
    if (lower.includes('bullish') && !lower.includes('moderately')) return 'oklch(0.45 0.15 145 / 0.12)';
    if (lower.includes('bearish') && !lower.includes('moderately')) return 'oklch(0.55 0.2 25 / 0.12)';
    if (lower.includes('moderately')) return 'oklch(0.7 0.15 85 / 0.12)';
    return 'var(--ns-surface)';
  };

  const getTrendIcon = (trend: string | undefined) => {
    if (!trend) return <Minus size={10} />;
    const lower = trend.toLowerCase();
    if (lower.includes('bullish')) return <TrendingUp size={10} />;
    if (lower.includes('bearish')) return <TrendingDown size={10} />;
    return <Minus size={10} />;
  };

  const TrendBadge: React.FC<{ label: string; value: string | undefined }> = ({ label, value }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 10, color: 'var(--ns-text-4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </span>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 10.5,
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: 99,
          background: getTrendBg(value),
          color: getTrendColor(value),
        }}
      >
        {getTrendIcon(value)}
        {value || 'N/A'}
      </span>
    </div>
  );

  const CardSkeleton = () => (
    <div className="ns-card" style={{ padding: 16 }}>
      <div className="ns-skeleton" style={{ width: '75%', height: 14 }} />
      <div className="ns-skeleton" style={{ width: '50%', height: 11, marginTop: 8 }} />
      <div className="ns-skeleton" style={{ width: '60%', height: 11, marginTop: 6 }} />
      <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
        <div className="ns-skeleton" style={{ width: 60, height: 18, borderRadius: 99 }} />
        <div className="ns-skeleton" style={{ width: 60, height: 18, borderRadius: 99 }} />
      </div>
    </div>
  );

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="ns-fade-up">
        <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>Stock Screener</h1>
        <p style={{ fontSize: 13, color: 'var(--ns-text-3)', marginTop: 4 }}>
          Search by industry, sector, or company
        </p>
      </div>

      {/* Search input */}
      <div className="ns-card" style={{ padding: 18 }}>
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ns-text-4)' }}>
            <Search size={16} />
          </span>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by industry, sector, or company name..."
            style={{
              width: '100%',
              padding: '10px 14px 10px 38px',
              fontSize: 13,
              fontFamily: 'inherit',
              background: 'var(--ns-surface)',
              border: '1px solid var(--ns-border)',
              borderRadius: 10,
              color: 'var(--ns-text)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Preset buttons */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {PRESETS.map(preset => (
            <button
              key={preset}
              onClick={() => handlePreset(preset)}
              style={{
                padding: '5px 14px',
                borderRadius: 8,
                fontSize: 11.5,
                fontWeight: 600,
                cursor: 'pointer',
                border: '1px solid var(--ns-border)',
                fontFamily: 'inherit',
                background: query === preset ? 'var(--ns-accent-soft)' : 'var(--ns-surface)',
                color: query === preset ? 'var(--ns-accent)' : 'var(--ns-text-3)',
                transition: 'all 0.15s ease',
              }}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : results.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {results.map((item, i) => {
            const nseCode = item.exchangeCodeNsi || '';
            const bseCode = item.exchangeCodeBse || '';
            const trends = item.activeStockTrends;

            return (
              <div
                key={item.id || i}
                className="ns-card"
                style={{
                  padding: 16,
                  cursor: nseCode ? 'pointer' : 'default',
                  transition: 'transform 0.15s ease',
                }}
                onClick={() => {
                  if (nseCode) handleSelectStock(nseCode);
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 6 }}>
                      {item.commonName || 'Unknown'}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {nseCode && (
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                          background: 'var(--ns-accent-soft)', color: 'var(--ns-accent)',
                        }}>
                          NSE: {nseCode}
                        </span>
                      )}
                      {bseCode && (
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                          background: 'var(--ns-surface)', color: 'var(--ns-text-2)',
                          border: '1px solid var(--ns-border)',
                        }}>
                          BSE: {bseCode}
                        </span>
                      )}
                      <span style={{
                        fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 99,
                        color: 'var(--ns-text-4)', border: '1px solid var(--ns-border)',
                      }}>
                        {item.stockType || 'Equity'}
                      </span>
                    </div>
                  </div>
                  {nseCode && (
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: 'var(--ns-accent)',
                      whiteSpace: 'nowrap', marginTop: 2,
                    }}>
                      View →
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : searched && !loading ? (
        <div className="ns-card" style={{ padding: 32, textAlign: 'center', color: 'var(--ns-text-3)', fontSize: 13 }}>
          No results found for "{query}". Try a different search term.
        </div>
      ) : null}
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

export default Screener;
