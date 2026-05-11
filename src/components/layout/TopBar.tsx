import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, X, LogOut, RefreshCcw, Sun, Moon } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface StockEntry {
  id: string;
  name: string;
  "bse-code": string;
  "nse-code": string;
}

interface TopBarProps {
  onSelectStock: (ticker: string) => void;
  onRefresh?: () => void;
}

let cachedCatalog: StockEntry[] = [];

const TopBar: React.FC<TopBarProps> = ({ onSelectStock, onRefresh }) => {
  const { username, logout } = useAuth();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState<StockEntry[]>([]);
  const [catalogCount, setCatalogCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Theme toggle state
  const [theme, setTheme] = useState(() =>
    document.documentElement.getAttribute('data-theme') || 'dark'
  );

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('ns-theme', next);
    setTheme(next);
  };

  useEffect(() => {
    const saved = localStorage.getItem('ns-theme');
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved);
      setTheme(saved);
    }
  }, []);

  // Ping indicator state
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  // Usage counter state
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(null);

  const checkPing = async () => {
    try {
      const res = await fetch('/api/proxy/dev/ping');
      const data = await res.json();
      setApiOnline(res.ok && Array.isArray(data) ? data[1] === 200 : res.ok);
    } catch {
      setApiOnline(false);
    }
  };

  const fetchUsage = async () => {
    try {
      const res = await fetch('/api/proxy/dev/usage');
      const data = await res.json();
      if (data && typeof data.total_requests === 'number') {
        setUsage({ used: data.total_requests, limit: data.remaining_requests });
      }
    } catch {
      // silently ignore
    }
  };

  useEffect(() => {
    checkPing();
    fetchUsage();
    const interval = setInterval(fetchUsage, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (cachedCatalog.length > 0) {
      setCatalogCount(cachedCatalog.length);
      return;
    }
    fetch('/api/stocks/catalog')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          cachedCatalog = data;
          setCatalogCount(data.length);
          console.log(`[TopBar] Loaded ${data.length} stocks from server catalog`);
        }
      })
      .catch(err => console.error('[TopBar] Failed to load catalog:', err));
  }, []);

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
      const results = cachedCatalog.filter(s =>
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

  const handleSelect = (stock: StockEntry) => {
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
          placeholder={`Search ${catalogCount ? catalogCount.toLocaleString() : ''} stocks by name, NSE or BSE code...`}
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
          onClick={checkPing}
          title={apiOnline === true ? 'API Online — click to recheck' : apiOnline === false ? 'API Offline — click to retry' : 'Checking API...'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 12px',
            borderRadius: 10,
            background: 'var(--ns-surface)',
            border: '1px solid var(--ns-border)',
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 600,
            fontFamily: 'inherit',
            color: apiOnline === true ? '#22c55e' : apiOnline === false ? '#ef4444' : 'var(--ns-text-3)',
            transition: 'all 0.18s ease',
            flexShrink: 0,
          }}
        >
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: apiOnline === true ? '#22c55e' : apiOnline === false ? '#ef4444' : '#a3a3a3',
          }} />
          {apiOnline === true ? 'Online' : apiOnline === false ? 'Offline' : '...'}
        </button>
        {usage && (
          <span
            style={{
              background: 'var(--ns-surface)',
              border: '1px solid var(--ns-border)',
              borderRadius: 99,
              padding: '4px 12px',
              fontSize: 11,
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            <span className="mono tnum">{usage.used.toLocaleString()}</span>
            <span style={{ color: 'var(--ns-text-4)', margin: '0 3px' }}>/</span>
            <span className="mono tnum">{usage.limit.toLocaleString()}</span>
          </span>
        )}
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
        <div className="ns-icon-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} style={{ cursor: 'pointer' }}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </div>
        <div className="ns-icon-btn"><Bell size={16} /></div>
        <div className="ns-avatar">{username ? username.slice(0, 2).toUpperCase() : 'U'}</div>
        <div className="ns-icon-btn" onClick={logout} title="Logout" style={{ cursor: 'pointer' }}><LogOut size={16} /></div>
      </div>
    </header>
  );
};

export default TopBar;
