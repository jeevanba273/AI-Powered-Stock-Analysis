import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, X, LogOut, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { stocksCatalog, StockInfo } from '@/data/stocksCatalog';
import { useAuth } from '@/contexts/AuthContext';

interface TopBarProps {
  onSelectStock: (ticker: string) => void;
  onRefresh?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onSelectStock, onRefresh }) => {
  const { username, logout } = useAuth();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState<StockInfo[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (query.trim().length > 0) {
      const q = query.toLowerCase();
      const results = stocksCatalog.filter(s =>
        s.name.toLowerCase().includes(q) ||
        (s["nse-code"] && s["nse-code"].toLowerCase().includes(q)) ||
        (s["bse-code"] && s["bse-code"].toLowerCase().includes(q))
      ).slice(0, 8);
      setFiltered(results);
      setOpen(results.length > 0);
    } else {
      setFiltered([]);
      setOpen(false);
    }
  }, [query]);

  const handleSelect = (stock: StockInfo) => {
    const ticker = stock["nse-code"] || stock["bse-code"];
    onSelectStock(ticker);
    setQuery('');
    setOpen(false);
  };

  return (
    <header className="ns-topbar">
      <div className="ns-search">
        <span className="ns-search-icon"><Search size={16} /></span>
        <input
          ref={inputRef}
          className="ns-search-input"
          placeholder="Search 4,798 stocks by name, NSE or BSE code..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (query.trim() && filtered.length > 0) setOpen(true); }}
          onBlur={() => setTimeout(() => setOpen(false), 180)}
          autoComplete="off"
        />
        <div className="ns-kbd-hint">
          <span className="ns-kbd">{navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}</span>
          <span className="ns-kbd">K</span>
        </div>

        {open && (
          <div className="ns-search-dropdown">
            {filtered.length === 0 ? (
              <div style={{ padding: 16, fontSize: 12.5, color: 'var(--ns-text-3)', textAlign: 'center' }}>
                No matches for &quot;{query}&quot;
              </div>
            ) : (
              filtered.map((stock) => {
                const ticker = stock["nse-code"] || stock["bse-code"];
                return (
                  <div
                    key={stock.id}
                    className="ns-search-result"
                    onMouseDown={() => handleSelect(stock)}
                  >
                    <div className="ns-tic-chip">{ticker.slice(0, 3)}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>
                        {ticker}
                        <span style={{ color: 'var(--ns-text-4)', fontWeight: 400, fontSize: 10.5, marginLeft: 4 }}>
                          {stock["nse-code"] ? 'NSE' : 'BSE'}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--ns-text-3)' }}>{stock.name}</div>
                    </div>
                    <div />
                    <div />
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      <div className="ns-topbar-right">
        <button
          className="ns-refresh-btn"
          onClick={async () => {
            try {
              await fetch('/api/proxy/clear-cache', { method: 'POST' });
              toast.success('Cache cleared — refreshing data');
              onRefresh?.();
            } catch {
              toast.error('Failed to clear cache');
            }
          }}
          title="Clear cache and refresh all data"
        >
          <RefreshCcw size={14} />
          <span>Refresh</span>
        </button>
        <div className="ns-icon-btn"><Bell size={16} /></div>
        <div className="ns-avatar">{username ? username.slice(0, 2).toUpperCase() : 'U'}</div>
        <div className="ns-icon-btn" onClick={logout} title="Logout" style={{ cursor: 'pointer' }}><LogOut size={16} /></div>
      </div>
    </header>
  );
};

export default TopBar;
