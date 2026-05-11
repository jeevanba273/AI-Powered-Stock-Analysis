import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BarChart3, Newspaper, Star, Search, Rocket, PiggyBank, ShoppingCart, ArrowLeftRight } from 'lucide-react';
import { popularIndianStocks } from '@/services/indianStockService';
import { fetchRetry } from '@/lib/fetchRetry';

interface SidebarProps {
  activeStock: string;
  onSelectStock: (ticker: string) => void;
}

const navItems = [
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/market', icon: BarChart3, label: 'Market' },
  { to: '/compare', icon: ArrowLeftRight, label: 'Compare' },
  { to: '/screener', icon: Search, label: 'Screener' },
  { to: '/ipo', icon: Rocket, label: 'IPO' },
  { to: '/mutual-funds', icon: PiggyBank, label: 'Mutual Funds' },
  { to: '/commodities', icon: ShoppingCart, label: 'Commodities' },
  { to: '/news', icon: Newspaper, label: 'News' },
];

const Sidebar: React.FC<SidebarProps> = ({ activeStock, onSelectStock }) => {
  const [prices, setPrices] = useState<Record<string, { ltp: number; pct: number }>>({});
  const prefetchedRef = useRef<Set<string>>(new Set());

  const prefetchStock = (ticker: string) => {
    if (prefetchedRef.current.has(ticker) || ticker === activeStock) return;
    prefetchedRef.current.add(ticker);
    // Fire-and-forget — just warm the server cache
    fetch('/api/proxy/dev/nse_stock_batch_live_price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock_symbols: [ticker] }),
    }).catch(() => {});
    fetch(`/api/proxy/dev/get_stock_data?stock_name=${ticker}`).catch(() => {});
    fetch(`/api/proxy/dev/historical_data?stock_name=${ticker}&period=1yr&filter=price`).catch(() => {});
  };

  useEffect(() => {
    const symbols = popularIndianStocks.map(s => s.ticker);

    Promise.allSettled(
      symbols.map(sym =>
        fetchRetry('/api/proxy/dev/nse_stock_batch_live_price', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stock_symbols: [sym] }),
        }).then(r => r.json())
      )
    ).then(results => {
      const mapped: Record<string, { ltp: number; pct: number }> = {};
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value && !result.value.error) {
          for (const [sym, info] of Object.entries(result.value as Record<string, any>)) {
            if (info && typeof info.ltp === 'number') {
              mapped[sym] = { ltp: info.ltp, pct: info.day_change_percent ?? 0 };
            }
          }
        }
      }
      setPrices(mapped);
    });
  }, []);

  return (
    <aside className="ns-sidebar">
      <div className="ns-brand">
        <div className="ns-brand-mark">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M3 17 L9 11 L13 14 L21 6" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="21" cy="6" r="2" fill="white"/>
          </svg>
        </div>
        <div>
          <div className="ns-brand-name">NeuraStock</div>
          <div className="ns-brand-sub">AI Markets · Live</div>
        </div>
      </div>

      <div>
        <div className="ns-nav-label">Workspace</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `ns-nav-item ${isActive ? 'active' : ''}`}
              style={{ textDecoration: 'none' }}
            >
              <item.icon size={16} /> {item.label}
            </NavLink>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
        <div className="ns-nav-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Watchlist</span>
          <Star size={14} style={{ opacity: 0.5 }} />
        </div>
        <div className="ns-watchlist">
          {popularIndianStocks.map((stock) => (
            <div
              key={stock.ticker}
              className={`ns-watch-row ${activeStock === stock.ticker ? 'active' : ''}`}
              onMouseEnter={() => prefetchStock(stock.ticker)}
              onClick={() => onSelectStock(stock.ticker)}
            >
              <div className="ns-watch-id">
                <span className="ns-watch-tic">{stock.ticker}</span>
                <span className="ns-watch-name">{stock.name}</span>
              </div>
              {prices[stock.ticker] && (
                <div className="ns-watch-pct">
                  <div className="mono tnum" style={{ fontSize: 12, fontWeight: 600 }}>
                    ₹{prices[stock.ticker].ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="mono" style={{ fontSize: 10.5, fontWeight: 600, color: prices[stock.ticker].pct >= 0 ? 'var(--ns-profit)' : 'var(--ns-loss)' }}>
                    {prices[stock.ticker].pct >= 0 ? '+' : ''}{prices[stock.ticker].pct.toFixed(2)}%
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
