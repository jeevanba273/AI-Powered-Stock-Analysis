import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Calendar, DollarSign, BarChart3 } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';

interface IPOEntry {
  companyName?: string;
  company_name?: string;
  name?: string;
  issueType?: string;
  issue_type?: string;
  openDate?: string;
  open_date?: string;
  closeDate?: string;
  close_date?: string;
  listingDate?: string;
  listing_date?: string;
  priceBand?: string;
  price_band?: string;
  minPrice?: number | string;
  maxPrice?: number | string;
  issueSize?: string | number;
  issue_size?: string | number;
  subscriptionStatus?: string | number;
  subscription_status?: string | number;
  subscriptionTimes?: number | string;
  listingPrice?: number | string;
  listing_price?: number | string;
  listingGain?: number | string;
  listing_gain?: number | string;
  status?: string;
  [key: string]: unknown;
}

type TabKey = 'upcoming' | 'open' | 'listed';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'open', label: 'Open' },
  { key: 'listed', label: 'Listed' },
];

const IPO: React.FC = () => {
  const navigate = useNavigate();
  const handleSelectStock = (ticker: string) => navigate('/stock/' + ticker);

  const [activeTab, setActiveTab] = useState<TabKey>('upcoming');
  const [ipos, setIpos] = useState<IPOEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const tabsRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState({ left: 0, width: 0 });

  useEffect(() => {
    if (!tabsRef.current) return;
    const activeEl = tabsRef.current.querySelector('.ns-chart-tab.active') as HTMLElement | null;
    if (activeEl) {
      setPill({ left: activeEl.offsetLeft, width: activeEl.offsetWidth });
    }
  }, [activeTab]);

  useEffect(() => {
    const fetchIPOs = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/proxy/dev/ipo/v2?status=${activeTab}`);
        const data = await res.json();

        let entries: IPOEntry[] = [];
        if (Array.isArray(data)) {
          entries = data;
        } else if (data && typeof data === 'object') {
          if (data.data && Array.isArray(data.data)) {
            entries = data.data;
          } else if (data.ipos && Array.isArray(data.ipos)) {
            entries = data.ipos;
          } else if (data.results && Array.isArray(data.results)) {
            entries = data.results;
          } else {
            const arr = Object.values(data).find(v => Array.isArray(v));
            if (Array.isArray(arr)) entries = arr as IPOEntry[];
          }
        }
        setIpos(entries);
      } catch (err) {
        console.error('[IPO] Fetch error:', err);
        setError('Failed to load IPO data. Please try again later.');
        setIpos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchIPOs();
  }, [activeTab]);

  const getName = (ipo: IPOEntry): string =>
    ipo.companyName || ipo.company_name || ipo.name || 'Unknown Company';

  const getIssueType = (ipo: IPOEntry): string =>
    ipo.issueType || ipo.issue_type || '-';

  const getOpenDate = (ipo: IPOEntry): string =>
    ipo.openDate || ipo.open_date || '-';

  const getCloseDate = (ipo: IPOEntry): string =>
    ipo.closeDate || ipo.close_date || '-';

  const getListingDate = (ipo: IPOEntry): string =>
    ipo.listingDate || ipo.listing_date || '-';

  const getPriceBand = (ipo: IPOEntry): string => {
    if (ipo.priceBand || ipo.price_band) return ipo.priceBand || ipo.price_band || '-';
    if (ipo.minPrice && ipo.maxPrice) return `₹${ipo.minPrice} - ₹${ipo.maxPrice}`;
    return '-';
  };

  const getIssueSize = (ipo: IPOEntry): string => {
    const size = ipo.issueSize || ipo.issue_size;
    if (!size) return '-';
    return String(size);
  };

  const getSubscription = (ipo: IPOEntry): string => {
    const sub = ipo.subscriptionTimes || ipo.subscriptionStatus || ipo.subscription_status;
    if (!sub) return '-';
    const n = Number(sub);
    if (!isNaN(n)) return n.toFixed(2) + 'x';
    return String(sub);
  };

  const getListingPrice = (ipo: IPOEntry): string => {
    const lp = ipo.listingPrice || ipo.listing_price;
    if (!lp) return '-';
    return '₹' + Number(lp).toFixed(2);
  };

  const getListingGain = (ipo: IPOEntry): { text: string; isPositive: boolean } => {
    const gain = ipo.listingGain || ipo.listing_gain;
    if (!gain) return { text: '-', isPositive: true };
    const n = Number(gain);
    if (isNaN(n)) return { text: String(gain), isPositive: true };
    return {
      text: (n >= 0 ? '+' : '') + n.toFixed(2) + '%',
      isPositive: n >= 0,
    };
  };

  const formatDate = (d: string): string => {
    if (!d || d === '-') return '-';
    try {
      return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return d;
    }
  };

  const CardSkeleton = () => (
    <div className="ns-card" style={{ padding: 16 }}>
      <div className="ns-skeleton" style={{ width: '70%', height: 15 }} />
      <div className="ns-skeleton" style={{ width: '40%', height: 11, marginTop: 8 }} />
      <div className="ns-skeleton" style={{ width: '55%', height: 11, marginTop: 6 }} />
      <div className="ns-skeleton" style={{ width: '45%', height: 11, marginTop: 6 }} />
      <div className="ns-skeleton" style={{ width: '30%', height: 18, marginTop: 12, borderRadius: 99 }} />
    </div>
  );

  const IPOCard: React.FC<{ ipo: IPOEntry }> = ({ ipo }) => {
    const gain = getListingGain(ipo);

    return (
      <div
        className="ns-card"
        style={{ padding: 16, transition: 'transform 0.15s ease' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
      >
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
          {getName(ipo)}
        </div>

        {getIssueType(ipo) !== '-' && (
          <span style={{
            display: 'inline-block', fontSize: 10, fontWeight: 600, padding: '2px 8px',
            borderRadius: 99, background: 'var(--ns-accent-soft)', color: 'var(--ns-accent)', marginBottom: 10,
          }}>
            {getIssueType(ipo)}
          </span>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, marginTop: 6 }}>
          {/* Dates */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ns-text-3)' }}>
            <Calendar size={12} />
            <span>
              {activeTab === 'listed'
                ? `Listed: ${formatDate(getListingDate(ipo))}`
                : `${formatDate(getOpenDate(ipo))} - ${formatDate(getCloseDate(ipo))}`}
            </span>
          </div>

          {/* Price band */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ns-text-3)' }}>
            <DollarSign size={12} />
            <span>Price Band: {getPriceBand(ipo)}</span>
          </div>

          {/* Issue size */}
          {getIssueSize(ipo) !== '-' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ns-text-3)' }}>
              <BarChart3 size={12} />
              <span>Issue Size: {getIssueSize(ipo)}</span>
            </div>
          )}

          {/* Subscription status for open IPOs */}
          {activeTab === 'open' && getSubscription(ipo) !== '-' && (
            <div style={{
              marginTop: 4, padding: '6px 10px', borderRadius: 8,
              background: 'var(--ns-surface)', border: '1px solid var(--ns-border)', fontSize: 11.5,
            }}>
              <span style={{ color: 'var(--ns-text-4)', marginRight: 6 }}>Subscription:</span>
              <span style={{ fontWeight: 600, color: 'var(--ns-accent)' }}>{getSubscription(ipo)}</span>
            </div>
          )}

          {/* Listing price and gain for listed IPOs */}
          {activeTab === 'listed' && (
            <div style={{
              marginTop: 4, padding: '6px 10px', borderRadius: 8,
              background: 'var(--ns-surface)', border: '1px solid var(--ns-border)', fontSize: 11.5,
              display: 'flex', gap: 12,
            }}>
              {getListingPrice(ipo) !== '-' && (
                <div>
                  <span style={{ color: 'var(--ns-text-4)', marginRight: 4 }}>Listing:</span>
                  <span style={{ fontWeight: 600 }}>{getListingPrice(ipo)}</span>
                </div>
              )}
              {gain.text !== '-' && (
                <div>
                  <span style={{ color: 'var(--ns-text-4)', marginRight: 4 }}>Gain:</span>
                  <span style={{
                    fontWeight: 600,
                    color: gain.isPositive ? 'var(--ns-profit)' : 'var(--ns-loss)',
                  }}>
                    {gain.text}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="ns-fade-up">
        <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>IPO Tracker</h1>
        <p style={{ fontSize: 13, color: 'var(--ns-text-3)', marginTop: 4 }}>
          Upcoming, open, and recently listed IPOs
        </p>
      </div>

      {/* Tab selector */}
      <div className="ns-chart-tabs" ref={tabsRef} style={{ alignSelf: 'flex-start' }}>
        <div className="ns-chart-tab-pill" style={{ left: pill.left, width: pill.width }} />
        {TABS.map(tab => (
          <div
            key={tab.key}
            className={`ns-chart-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </div>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="ns-card" style={{ padding: 24, textAlign: 'center', color: 'var(--ns-loss)', fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : !error && ipos.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {ipos.map((ipo, i) => (
            <IPOCard key={i} ipo={ipo} />
          ))}
        </div>
      ) : !error && !loading ? (
        <div className="ns-card" style={{ padding: 32, textAlign: 'center', color: 'var(--ns-text-3)', fontSize: 13 }}>
          <Rocket size={24} style={{ opacity: 0.3, marginBottom: 8 }} />
          <div>No {activeTab} IPOs found at the moment.</div>
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

export default IPO;
