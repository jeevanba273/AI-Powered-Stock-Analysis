import React from 'react';
import { Home, Layers, Activity, Newspaper, Sparkles, Star } from 'lucide-react';
import { popularIndianStocks } from '@/services/indianStockService';

interface SidebarProps {
  activeStock: string;
  onSelectStock: (ticker: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeStock, onSelectStock }) => {
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
          <div className="ns-nav-item active"><Home size={16} /> Dashboard</div>
          <div className="ns-nav-item"><Layers size={16} /> Portfolio</div>
          <div className="ns-nav-item"><Activity size={16} /> Screener</div>
          <div className="ns-nav-item"><Newspaper size={16} /> News Feed</div>
          <div className="ns-nav-item"><Sparkles size={16} /> AI Insights <span className="ns-nav-badge">NEW</span></div>
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
              onClick={() => onSelectStock(stock.ticker)}
            >
              <div className="ns-watch-id">
                <span className="ns-watch-tic">{stock.ticker}</span>
                <span className="ns-watch-name">{stock.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
