import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Calendar, DollarSign, BarChart3, X, ExternalLink } from 'lucide-react';
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
  id?: string | number;
  slug?: string;
  ipo_id?: string | number;
  [key: string]: unknown;
}

interface IPODetail {
  companyName?: string;
  company_name?: string;
  name?: string;
  industry?: string;
  sector?: string;
  priceBand?: string;
  price_band?: string;
  minPrice?: number | string;
  maxPrice?: number | string;
  lotSize?: number | string;
  lot_size?: number | string;
  issueSize?: string | number;
  issue_size?: string | number;
  openDate?: string;
  open_date?: string;
  closeDate?: string;
  close_date?: string;
  listingDate?: string;
  listing_date?: string;
  listingPrice?: number | string;
  listing_price?: number | string;
  listingGain?: number | string;
  listing_gain?: number | string;
  subscriptionStatus?: Record<string, unknown> | unknown;
  subscription_status?: Record<string, unknown> | unknown;
  retailSubscription?: number | string;
  retail_subscription?: number | string;
  niiSubscription?: number | string;
  nii_subscription?: number | string;
  qibSubscription?: number | string;
  qib_subscription?: number | string;
  rhpLink?: string;
  rhp_link?: string;
  drhpLink?: string;
  drhp_link?: string;
  rhp?: string;
  drhp?: string;
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
  const [visibleCount, setVisibleCount] = useState(20);
  const ipoCache = useRef<Record<string, IPOEntry[]>>({});

  // IPO detail state
  const [selectedIPOId, setSelectedIPOId] = useState<string | null>(null);
  const [ipoDetail, setIpoDetail] = useState<IPODetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

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
    setSelectedIPOId(null);
    setIpoDetail(null);
    setVisibleCount(20);

    // Return cached data instantly if available
    if (ipoCache.current[activeTab]) {
      setIpos(ipoCache.current[activeTab]);
      setLoading(false);
      return;
    }

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
        ipoCache.current[activeTab] = entries;
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

  const getOpenDate = (ipo: any): string =>
    ipo.biddingStartDate || ipo.openDate || ipo.open_date || '-';

  const getCloseDate = (ipo: any): string =>
    ipo.biddingEndDate || ipo.closeDate || ipo.close_date || '-';

  const getListingDate = (ipo: any): string =>
    ipo.listingDate || ipo.listing_date || ipo.timeline?.listingDate || '-';

  const getPriceBand = (ipo: any): string => {
    if (ipo.minimumPrice && ipo.maximumPrice) return `₹${ipo.minimumPrice} - ₹${ipo.maximumPrice}`;
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

  const getIPOId = (ipo: IPOEntry): string => {
    // Try common id fields, fall back to slugified company name
    if (ipo.id) return String(ipo.id);
    if (ipo.slug) return String(ipo.slug);
    if (ipo.ipo_id) return String(ipo.ipo_id);
    const name = getName(ipo);
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const openIPODetail = async (ipo: IPOEntry) => {
    const ipoId = getIPOId(ipo);
    if (selectedIPOId === ipoId) {
      setSelectedIPOId(null);
      setIpoDetail(null);
      return;
    }
    setSelectedIPOId(ipoId);
    setIpoDetail(null);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/proxy/dev/ipo/${encodeURIComponent(ipoId)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.json();
      const d = raw?.data || raw;
      setIpoDetail({
        name: d.basic?.name || d.name,
        industry: d.basic?.industry || d.industry,
        symbol: d.basic?.symbol || d.symbol,
        priceBand: d.pricing?.priceRange ? `₹${d.pricing.priceRange.min} - ₹${d.pricing.priceRange.max}` : undefined,
        cutOffPrice: d.pricing?.priceRange?.cutOff || d.pricing?.cutOff,
        faceValue: d.pricing?.faceValue,
        lotSize: d.issue?.lotSize || d.lotSize,
        issueSize: d.issue?.size || d.issueSize,
        minimumInvestment: d.issue?.minimumInvestment,
        openDate: d.dates?.bidding?.start,
        closeDate: d.dates?.bidding?.end,
        listingDate: d.dates?.listing,
        allotmentDate: d.dates?.allotment,
        rhpUrl: d.documents?.rhp || d.rhpUrl || raw.rhpUrl,
        drhpUrl: d.documents?.drhp || d.drhpUrl,
        allotmentLinkUrl: d.documents?.allotmentStatus || d.allotmentLinkUrl || raw.allotmentLinkUrl,
        totalSubscription: d.subscription?.overallFormatted || d.subscription?.overall,
        retailSubscription: d.subscription?.daily?.[d.subscription.daily.length - 1]?.categories?.retailIndividual?.timesFormatted,
        niiSubscription: d.subscription?.daily?.[d.subscription.daily.length - 1]?.categories?.nonInstitutional?.timesFormatted,
        qibSubscription: d.subscription?.daily?.[d.subscription.daily.length - 1]?.categories?.qualifiedInstitutional?.timesFormatted,
        listingPrice: d.listing?.listingPrice,
        listingGain: d.listing?.listingGainPercent || d.listing?.gainPercent,
        timeline: d.timeline || {},
        exchanges: d.exchanges?.primary,
      } as any);
    } catch (err) {
      console.error('[IPO] Detail fetch error:', err);
      setIpoDetail({});
    } finally {
      setDetailLoading(false);
    }
  };

  const getDetailName = (d: IPODetail): string =>
    d.companyName || d.company_name || d.name || '';

  const getDetailIndustry = (d: IPODetail): string =>
    d.industry || d.sector || '';

  const getDetailPriceBand = (d: IPODetail): string => {
    if (d.priceBand || d.price_band) return d.priceBand || d.price_band || '';
    if (d.minPrice && d.maxPrice) return `₹${d.minPrice} - ₹${d.maxPrice}`;
    return '';
  };

  const getDetailLotSize = (d: IPODetail): string => {
    const lot = d.lotSize || d.lot_size;
    return lot ? String(lot) : '';
  };

  const getDetailIssueSize = (d: IPODetail): string => {
    const size = d.issueSize || d.issue_size;
    return size ? String(size) : '';
  };

  const getDetailSubscriptions = (d: IPODetail): { retail: string; nii: string; qib: string } | null => {
    // Try dedicated fields first
    const retail = d.retailSubscription || d.retail_subscription;
    const nii = d.niiSubscription || d.nii_subscription;
    const qib = d.qibSubscription || d.qib_subscription;
    if (retail || nii || qib) {
      return {
        retail: retail ? String(retail) : '--',
        nii: nii ? String(nii) : '--',
        qib: qib ? String(qib) : '--',
      };
    }
    // Try nested subscription object
    const sub = d.subscriptionStatus || d.subscription_status;
    if (sub && typeof sub === 'object' && !Array.isArray(sub)) {
      const s = sub as Record<string, unknown>;
      const r = s.retail || s.Retail || s.RII || s.rii;
      const n = s.nii || s.NII || s.hni || s.HNI;
      const q = s.qib || s.QIB;
      if (r || n || q) {
        return {
          retail: r ? String(r) : '--',
          nii: n ? String(n) : '--',
          qib: q ? String(q) : '--',
        };
      }
    }
    return null;
  };

  const getDetailListingInfo = (d: IPODetail): { date: string; price: string; gain: string; gainPositive: boolean } | null => {
    const lDate = d.listingDate || d.listing_date;
    const lPrice = d.listingPrice || d.listing_price;
    const lGain = d.listingGain || d.listing_gain;
    if (!lDate && !lPrice && !lGain) return null;
    const gainNum = lGain ? Number(lGain) : NaN;
    return {
      date: lDate ? formatDate(String(lDate)) : '--',
      price: lPrice ? '₹' + Number(lPrice).toFixed(2) : '--',
      gain: !isNaN(gainNum) ? ((gainNum >= 0 ? '+' : '') + gainNum.toFixed(2) + '%') : '--',
      gainPositive: isNaN(gainNum) || gainNum >= 0,
    };
  };

  const getDetailRHPLink = (d: any): string =>
    d.rhpUrl || d.rhpLink || d.rhp_link || d.rhp || '';

  const getDetailDRHPLink = (d: any): string =>
    d.drhpUrl || d.drhpLink || d.drhp_link || d.drhp || '';

  const getDetailAllotmentLink = (d: any): string =>
    d.allotmentLinkUrl || d.allotmentLink || '';

  const IPODetailPanel: React.FC<{ detail: IPODetail; onClose: () => void }> = ({ detail, onClose }) => {
    const name = getDetailName(detail);
    const industry = getDetailIndustry(detail);
    const priceBand = getDetailPriceBand(detail);
    const lotSize = getDetailLotSize(detail);
    const issueSize = getDetailIssueSize(detail);
    const subs = getDetailSubscriptions(detail);
    const listing = getDetailListingInfo(detail);
    const rhpLink = getDetailRHPLink(detail);
    const drhpLink = getDetailDRHPLink(detail);
    const allotmentLink = getDetailAllotmentLink(detail);
    const openDate = (detail as any).biddingStartDate || detail.openDate || detail.open_date;
    const closeDate = (detail as any).biddingEndDate || detail.closeDate || detail.close_date;
    const timeline = (detail as any).timeline || {};

    const minInvestment = (detail as any).minimumInvestment || '';
    const hasAnyInfo = name || industry || priceBand || lotSize || issueSize || subs || listing || rhpLink || drhpLink || minInvestment;

    return (
      <div className="ns-card" style={{ padding: 0, overflow: 'hidden', marginTop: -2 }}>
        <div style={{ padding: '16px 20px', background: 'var(--ns-surface)', borderTop: '1px solid var(--ns-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              {name && <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{name}</div>}
              {industry && <div style={{ fontSize: 12, color: 'var(--ns-text-3)' }}>{industry}</div>}
            </div>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ns-text-3)', padding: 4 }}
            >
              <X size={16} />
            </button>
          </div>

          {!hasAnyInfo && (
            <div style={{ fontSize: 12, color: 'var(--ns-text-4)', padding: '8px 0' }}>
              Detailed information not available for this IPO.
            </div>
          )}

          {/* Key info grid */}
          {(priceBand || lotSize || issueSize || openDate || closeDate) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px 16px', marginBottom: 14, fontSize: 12 }}>
              {priceBand && (
                <div>
                  <div style={{ color: 'var(--ns-text-4)', marginBottom: 2 }}>Price Band</div>
                  <div style={{ fontWeight: 600 }}>{priceBand}</div>
                </div>
              )}
              {lotSize && (
                <div>
                  <div style={{ color: 'var(--ns-text-4)', marginBottom: 2 }}>Lot Size</div>
                  <div style={{ fontWeight: 600 }}>{lotSize}</div>
                </div>
              )}
              {issueSize && (
                <div>
                  <div style={{ color: 'var(--ns-text-4)', marginBottom: 2 }}>Issue Size</div>
                  <div style={{ fontWeight: 600 }}>{issueSize}</div>
                </div>
              )}
              {openDate && (
                <div>
                  <div style={{ color: 'var(--ns-text-4)', marginBottom: 2 }}>Open Date</div>
                  <div style={{ fontWeight: 600 }}>{formatDate(String(openDate))}</div>
                </div>
              )}
              {closeDate && (
                <div>
                  <div style={{ color: 'var(--ns-text-4)', marginBottom: 2 }}>Close Date</div>
                  <div style={{ fontWeight: 600 }}>{formatDate(String(closeDate))}</div>
                </div>
              )}
              {minInvestment && (
                <div>
                  <div style={{ color: 'var(--ns-text-4)', marginBottom: 2 }}>Min Investment</div>
                  <div style={{ fontWeight: 600, color: 'var(--ns-accent)' }}>{minInvestment}</div>
                </div>
              )}
            </div>
          )}

          {/* Subscription by category */}
          {subs && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ns-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Subscription Status
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  { label: 'Retail', value: subs.retail },
                  { label: 'NII', value: subs.nii },
                  { label: 'QIB', value: subs.qib },
                ].map(item => (
                  <div key={item.label} style={{
                    padding: '8px 12px', borderRadius: 8,
                    background: 'rgba(255,255,255,0.02)', border: '1px solid var(--ns-border)',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 10.5, color: 'var(--ns-text-4)', marginBottom: 2 }}>{item.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ns-accent)' }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Listing performance */}
          {listing && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ns-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Listing Performance
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '6px 16px', fontSize: 12 }}>
                <div>
                  <div style={{ color: 'var(--ns-text-4)', marginBottom: 2 }}>Listing Date</div>
                  <div style={{ fontWeight: 600 }}>{listing.date}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--ns-text-4)', marginBottom: 2 }}>Listing Price</div>
                  <div style={{ fontWeight: 600 }}>{listing.price}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--ns-text-4)', marginBottom: 2 }}>Listing Gain</div>
                  <div style={{ fontWeight: 600, color: listing.gainPositive ? 'var(--ns-profit)' : 'var(--ns-loss)' }}>
                    {listing.gain}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          {Object.keys(timeline).length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ns-text-3)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 8 }}>Timeline</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
                {[
                  { key: 'applicationStartDate', label: 'Open Date' },
                  { key: 'applicationEndDate', label: 'Close Date' },
                  { key: 'allotmentDate', label: 'Allotment' },
                  { key: 'refundInitiationDate', label: 'Refund' },
                  { key: 'listingDate', label: 'Listing' },
                ].map(({ key, label }) => timeline[key] ? (
                  <div key={key} style={{ padding: '6px 10px', borderRadius: 8, background: 'var(--ns-surface)', border: '1px solid var(--ns-border)' }}>
                    <div style={{ fontSize: 10, color: 'var(--ns-text-4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                    <div className="mono" style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{formatDate(timeline[key])}</div>
                  </div>
                ) : null)}
              </div>
            </div>
          )}

          {/* Document links */}
          {(rhpLink || drhpLink || allotmentLink) && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {rhpLink && (
                <a href={rhpLink} target="_blank" rel="noopener noreferrer" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600,
                  color: 'var(--ns-accent)', textDecoration: 'none', padding: '6px 12px', borderRadius: 6,
                  border: '1px solid var(--ns-border)', background: 'var(--ns-surface)',
                }}>
                  <ExternalLink size={12} /> RHP
                </a>
              )}
              {drhpLink && (
                <a href={drhpLink} target="_blank" rel="noopener noreferrer" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600,
                  color: 'var(--ns-accent)', textDecoration: 'none', padding: '6px 12px', borderRadius: 6,
                  border: '1px solid var(--ns-border)', background: 'var(--ns-surface)',
                }}>
                  <ExternalLink size={12} /> DRHP
                </a>
              )}
              {allotmentLink && (
                <a href={allotmentLink} target="_blank" rel="noopener noreferrer" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600,
                  color: 'var(--ns-profit)', textDecoration: 'none', padding: '6px 12px', borderRadius: 6,
                  border: '1px solid var(--ns-border)', background: 'var(--ns-surface)',
                }}>
                  <ExternalLink size={12} /> Check Allotment
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    );
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
    const ipoId = getIPOId(ipo);
    const isSelected = selectedIPOId === ipoId;

    return (
      <div
        className="ns-card"
        style={{
          padding: 16, transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          cursor: 'pointer',
          outline: isSelected ? '1px solid var(--ns-accent)' : 'none',
        }}
        onClick={() => openIPODetail(ipo)}
        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.transform = 'none'; }}
      >
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
          {getName(ipo)}
        </div>

        {/* Badges row */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
          {getIssueType(ipo) !== '-' && (
            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: 'var(--ns-accent-soft)', color: 'var(--ns-accent)' }}>
              {getIssueType(ipo)}
            </span>
          )}
          {(ipo as any).industry && (ipo as any).industry !== 'Not specified' && (
            <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 99, color: 'var(--ns-text-3)', border: '1px solid var(--ns-border)' }}>
              {(ipo as any).industry}
            </span>
          )}
          {(ipo as any).listingExchange && (
            <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 99, color: 'var(--ns-text-4)', border: '1px solid var(--ns-border)' }}>
              {(ipo as any).listingExchange}
            </span>
          )}
          {(ipo as any).symbol && (
            <span className="mono" style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99, color: 'var(--ns-text-2)', background: 'var(--ns-surface)' }}>
              {(ipo as any).symbol}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12 }}>
          {/* Dates */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ns-text-3)' }}>
            <Calendar size={12} />
            <span>{formatDate(getOpenDate(ipo))} - {formatDate(getCloseDate(ipo))}</span>
          </div>

          {/* Price band + lot size */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ns-text-3)' }}>
            <DollarSign size={12} />
            <span>
              {getPriceBand(ipo)}
              {(ipo as any).lotSize ? ` · Lot: ${(ipo as any).lotSize}` : ''}
              {(ipo as any).cutOffPrice ? ` · Cut-off: ₹${(ipo as any).cutOffPrice}` : ''}
            </span>
          </div>

          {/* Issue size + face value + min investment */}
          {getIssueSize(ipo) !== '-' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ns-text-3)' }}>
              <BarChart3 size={12} />
              <span>
                Issue: ₹{getIssueSize(ipo)} Cr
                {(ipo as any).faceValue ? ` · FV: ₹${(ipo as any).faceValue}` : ''}
                {(ipo as any).minimumQuantity && (ipo as any).maximumPrice
                  ? ` · Min: ₹${((ipo as any).minimumQuantity * (ipo as any).maximumPrice).toLocaleString('en-IN')}`
                  : ''}
              </span>
            </div>
          )}

          {/* Subscription — show on all tabs when available */}
          {(ipo as any).totalSubscription && (
            <div style={{
              marginTop: 2, padding: '5px 10px', borderRadius: 8,
              background: 'var(--ns-surface)', border: '1px solid var(--ns-border)', fontSize: 11.5,
            }}>
              <span style={{ color: 'var(--ns-text-4)', marginRight: 6 }}>Subscription:</span>
              <span style={{ fontWeight: 600, color: 'var(--ns-accent)' }}>{(ipo as any).totalSubscription}x</span>
            </div>
          )}

          {/* Listing price and gain for listed IPOs */}
          {activeTab === 'listed' && (getListingPrice(ipo) !== '-' || gain.text !== '-') && (
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
            {ipos.slice(0, visibleCount).map((ipo, i) => {
              const ipoId = getIPOId(ipo);
              const isSelected = selectedIPOId === ipoId;
              return (
                <React.Fragment key={i}>
                  <IPOCard ipo={ipo} />
                  {isSelected && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      {detailLoading ? (
                        <div className="ns-card" style={{ padding: 16 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                            {[1, 2, 3, 4, 5, 6].map(j => (
                              <div key={j}>
                                <div className="ns-skeleton" style={{ width: 70, height: 10, marginBottom: 6 }} />
                                <div className="ns-skeleton" style={{ width: 110, height: 13 }} />
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : ipoDetail ? (
                        <IPODetailPanel
                          detail={ipoDetail}
                          onClose={() => { setSelectedIPOId(null); setIpoDetail(null); }}
                        />
                      ) : null}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
          {visibleCount < ipos.length && (
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <button className="ns-ai-cta" onClick={() => setVisibleCount(c => c + 20)}>
                Load More ({ipos.length - visibleCount} remaining)
              </button>
            </div>
          )}
          {ipos.length > 0 && (
            <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--ns-text-4)', marginTop: 4 }}>
              Showing {Math.min(visibleCount, ipos.length)} of {ipos.length} IPOs
            </div>
          )}
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
