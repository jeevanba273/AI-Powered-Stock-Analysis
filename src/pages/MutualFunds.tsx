import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PiggyBank, Search, Star, X, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';

/* ---------- Types ---------- */

interface MutualFund {
  fund_name: string;
  latest_nav?: number | string;
  percentage_change?: number | string;
  asset_size?: number | string;
  star_rating?: number | string;
  '1_month_return'?: number | string;
  '3_month_return'?: number | string;
  '1_year_return'?: number | string;
  '3_year_return'?: number | string;
  '5_year_return'?: number | string;
  [key: string]: unknown;
}

interface FundDetail {
  fund_name?: string;
  category?: string;
  sub_category?: string;
  risk_level?: string;
  fund_manager?: string;
  fund_house?: string;
  launch_date?: string;
  expense_ratio?: number | string;
  aum?: number | string;
  latest_nav?: number | string;
  exit_load?: string;
  benchmark?: string;
  min_investment?: number | string;
  min_sip?: number | string;
  star_rating?: number | string;
  '1_month_return'?: number | string;
  '3_month_return'?: number | string;
  '1_year_return'?: number | string;
  '3_year_return'?: number | string;
  '5_year_return'?: number | string;
  [key: string]: unknown;
}

// Data from the API can be nested in various ways
type CategoryData = Record<string, Record<string, MutualFund[]> | MutualFund[]>;

/* ---------- Component ---------- */

const MutualFunds: React.FC = () => {
  const navigate = useNavigate();
  const handleSelectStock = (ticker: string) => navigate(`/stock/${ticker}`);

  // Browse state
  const [categories, setCategories] = useState<CategoryData>({});
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MutualFund[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Detail state
  const [selectedFund, setSelectedFund] = useState<string | null>(null);
  const [selectedFundRow, setSelectedFundRow] = useState<MutualFund | null>(null);
  const [fundDetail, setFundDetail] = useState<FundDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  /* ---------- Fetch categories ---------- */

  useEffect(() => {
    const fetchFunds = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/proxy/dev/mutual_funds');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // Normalize: the API might return { "Equity": { "Large Cap": [...] } }
        // or { "Equity": [...] } or a flat array. Handle all.
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          setCategories(data as CategoryData);
          const keys = Object.keys(data);
          // Default to "Equity" if it exists, otherwise the first key
          if (keys.includes('Equity')) {
            setActiveCategory('Equity');
          } else if (keys.length > 0) {
            setActiveCategory(keys[0]);
          }
        } else {
          console.warn('[MutualFunds] Unexpected data format:', data);
          setError('Unexpected data format from server.');
        }
      } catch (err) {
        console.error('[MutualFunds] Fetch error:', err);
        setError('Failed to load mutual funds data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchFunds();
  }, []);

  /* ---------- Search ---------- */

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/proxy/dev/mutual_fund_search?query=${encodeURIComponent(searchQuery.trim())}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const results = Array.isArray(data) ? data : (data?.results || data?.funds || []);
        setSearchResults(results.slice(0, 15));
        setSearchOpen(results.length > 0);
      } catch (err) {
        console.error('[MutualFunds] Search error:', err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [searchQuery]);

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  /* ---------- Fund detail ---------- */

  /** Check if a detail response has meaningful data beyond just a fund_name */
  const isDetailEmpty = (data: FundDetail): boolean => {
    const meaningfulKeys = [
      'category', 'sub_category', 'risk_level', 'fund_manager', 'fund_house',
      'launch_date', 'expense_ratio', 'aum', 'exit_load', 'benchmark',
      'min_investment', 'min_sip',
      '1_month_return', '3_month_return', '1_year_return', '3_year_return', '5_year_return',
    ];
    return !meaningfulKeys.some(k => {
      const v = data[k];
      return v !== undefined && v !== null && v !== '' && v !== 'N/A' && v !== '-';
    });
  };

  const openFundDetail = async (fundName: string, fundRow?: MutualFund) => {
    if (selectedFund === fundName) {
      setSelectedFund(null);
      setSelectedFundRow(null);
      setFundDetail(null);
      return;
    }
    setSelectedFund(fundName);
    setSelectedFundRow(fundRow || null);
    setFundDetail(null);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/proxy/dev/mutual_funds_details?stock_name=${encodeURIComponent(fundName)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setFundDetail(data);
    } catch (err) {
      console.error('[MutualFunds] Detail error:', err);
      setFundDetail({ fund_name: fundName });
    } finally {
      setDetailLoading(false);
    }
  };

  /* ---------- Helpers ---------- */

  const num = (v: unknown): number => {
    if (v === null || v === undefined || v === '' || v === 'N/A' || v === '-') return NaN;
    return Number(v);
  };

  const formatNav = (v: unknown) => {
    const n = num(v);
    return isNaN(n) ? (v ? String(v) : '--') : n.toFixed(2);
  };

  const formatReturn = (v: unknown) => {
    const n = num(v);
    if (isNaN(n)) return '--';
    return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
  };

  const returnColor = (v: unknown) => {
    const n = num(v);
    if (isNaN(n)) return 'var(--ns-text-3)';
    return n >= 0 ? 'var(--ns-profit)' : 'var(--ns-loss)';
  };

  const formatAssetSize = (v: unknown) => {
    const n = num(v);
    if (isNaN(n)) return v ? String(v) : '--';
    if (n >= 10000) return (n / 10000).toFixed(0) + ' L Cr';
    if (n >= 1000) return (n / 1000).toFixed(1) + ' K Cr';
    return n.toFixed(0) + ' Cr';
  };

  const renderStars = (rating: unknown) => {
    const n = Math.round(num(rating));
    if (isNaN(n) || n <= 0) return <span style={{ color: 'var(--ns-text-4)', fontSize: 11 }}>--</span>;
    return (
      <span style={{ display: 'inline-flex', gap: 1 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            size={12}
            fill={i <= n ? 'var(--ns-accent)' : 'none'}
            stroke={i <= n ? 'var(--ns-accent)' : 'var(--ns-text-4)'}
          />
        ))}
      </span>
    );
  };

  /* ---------- Table header styles ---------- */

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

  const thLeft: React.CSSProperties = { ...thStyle, textAlign: 'left' };

  const tdStyle: React.CSSProperties = {
    textAlign: 'right',
    padding: '10px 10px',
    fontSize: 12.5,
    whiteSpace: 'nowrap',
  };

  const tdLeft: React.CSSProperties = { ...tdStyle, textAlign: 'left' };

  /* ---------- Sub-category section ---------- */

  const getCategoryEntries = (): [string, MutualFund[]][] => {
    const catData = categories[activeCategory];
    if (!catData) return [];

    // If the value is an array of funds directly
    if (Array.isArray(catData)) {
      return [['All Funds', catData]];
    }

    // If the value is an object with sub-category keys
    const entries: [string, MutualFund[]][] = [];
    for (const [subCat, funds] of Object.entries(catData)) {
      if (Array.isArray(funds)) {
        entries.push([subCat, funds]);
      }
    }
    return entries;
  };

  /* ---------- Fund Detail Panel ---------- */

  const DetailPanel: React.FC<{ detail: FundDetail; fundRow?: MutualFund | null }> = ({ detail, fundRow }) => {
    const detailEmpty = isDetailEmpty(detail);

    // For returns, prefer detail data but fall back to fundRow data from the main listing
    const getReturn = (key: string): unknown => {
      const detailVal = detail[key];
      if (detailVal !== undefined && detailVal !== null && detailVal !== '' && detailVal !== 'N/A' && detailVal !== '-') {
        return detailVal;
      }
      if (fundRow) {
        return fundRow[key];
      }
      return detailVal;
    };

    const infoRows: [string, string][] = [
      ['Category', String(detail.category || '--')],
      ['Sub Category', String(detail.sub_category || '--')],
      ['Risk Level', String(detail.risk_level || '--')],
      ['Fund House', String(detail.fund_house || '--')],
      ['Fund Manager', String(detail.fund_manager || '--')],
      ['Launch Date', String(detail.launch_date || '--')],
      ['Expense Ratio', detail.expense_ratio !== undefined && detail.expense_ratio !== null ? num(detail.expense_ratio).toFixed(2) + '%' : '--'],
      ['AUM', detail.aum ? formatAssetSize(detail.aum) : '--'],
      ['NAV', formatNav(detail.latest_nav)],
      ['Exit Load', String(detail.exit_load || '--')],
      ['Benchmark', String(detail.benchmark || '--')],
      ['Min Investment', detail.min_investment ? '₹' + Number(detail.min_investment).toLocaleString('en-IN') : '--'],
      ['Min SIP', detail.min_sip ? '₹' + Number(detail.min_sip).toLocaleString('en-IN') : '--'],
    ];

    const returnRows: [string, unknown][] = [
      ['1M Return', getReturn('1_month_return')],
      ['3M Return', getReturn('3_month_return')],
      ['1Y Return', getReturn('1_year_return')],
      ['3Y Return', getReturn('3_year_return')],
      ['5Y Return', getReturn('5_year_return')],
    ];

    // Use star rating from detail, falling back to fundRow
    const starRating = detail.star_rating || (fundRow ? fundRow.star_rating : undefined);

    return (
      <div style={{ padding: '16px 20px', background: 'var(--ns-surface)', borderTop: '1px solid var(--ns-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{detail.fund_name || selectedFund}</div>
            {starRating && (
              <div style={{ marginTop: 4 }}>{renderStars(starRating)}</div>
            )}
          </div>
          <button
            onClick={() => { setSelectedFund(null); setSelectedFundRow(null); setFundDetail(null); }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--ns-text-3)', padding: 4
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Show notice when detail API returned no useful data */}
        {detailEmpty && (
          <div style={{
            padding: '10px 14px', marginBottom: 14, borderRadius: 6,
            background: 'rgba(255,255,255,0.03)', border: '1px solid var(--ns-border)',
            fontSize: 12, color: 'var(--ns-text-3)',
          }}>
            Detailed fund information not available. Showing returns from the fund listing.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
          {/* Fund Info - only show section if detail has meaningful info */}
          {!detailEmpty && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ns-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Fund Information
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', fontSize: 12 }}>
                {infoRows.map(([label, value]) => (
                  value !== '--' ? (
                    <React.Fragment key={label}>
                      <div style={{ color: 'var(--ns-text-4)' }}>{label}</div>
                      <div style={{ fontWeight: 600 }}>{value}</div>
                    </React.Fragment>
                  ) : null
                ))}
              </div>
            </div>
          )}

          {/* Returns - always show, using fallback from fundRow when detail is empty */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ns-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Returns
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', fontSize: 12 }}>
              {returnRows.map(([label, value]) => (
                <React.Fragment key={label}>
                  <div style={{ color: 'var(--ns-text-4)' }}>{label}</div>
                  <div className="mono tnum" style={{ fontWeight: 600, color: returnColor(value) }}>
                    {formatReturn(value)}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ---------- Fund Table ---------- */

  const FundTable: React.FC<{ funds: MutualFund[]; subCategory: string }> = ({ funds, subCategory }) => {
    const [collapsed, setCollapsed] = useState(false);

    return (
      <div className="ns-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          className="ns-card-header"
          style={{ padding: '14px 18px', cursor: 'pointer', userSelect: 'none' }}
          onClick={() => setCollapsed(!collapsed)}
        >
          <div className="ns-card-title">{subCategory}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10.5, color: 'var(--ns-text-4)' }}>{funds.length} funds</span>
            {collapsed ? <ChevronDown size={14} style={{ color: 'var(--ns-text-4)' }} /> : <ChevronUp size={14} style={{ color: 'var(--ns-text-4)' }} />}
          </div>
        </div>

        {!collapsed && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--ns-border)' }}>
                  <th style={{ ...thLeft, minWidth: 220 }}>Fund Name</th>
                  <th style={thStyle}>NAV</th>
                  <th style={thStyle}>Change</th>
                  <th style={thStyle}>Rating</th>
                  <th style={thStyle}>AUM</th>
                  <th style={thStyle}>1M</th>
                  <th style={thStyle}>3M</th>
                  <th style={thStyle}>1Y</th>
                  <th style={thStyle}>3Y</th>
                  <th style={thStyle}>5Y</th>
                </tr>
              </thead>
              <tbody>
                {funds.map((fund, i) => {
                  const isSelected = selectedFund === fund.fund_name;
                  return (
                    <React.Fragment key={i}>
                      <tr
                        style={{
                          borderBottom: '1px solid var(--ns-border)',
                          cursor: 'pointer',
                          background: isSelected ? 'var(--ns-accent-soft)' : 'transparent',
                          transition: 'background 0.15s ease',
                        }}
                        onClick={() => openFundDetail(fund.fund_name, fund)}
                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <td style={{ ...tdLeft, fontWeight: 600, maxWidth: 300 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {fund.fund_name}
                          </div>
                        </td>
                        <td className="mono tnum" style={{ ...tdStyle, fontWeight: 600 }}>
                          {formatNav(fund.latest_nav)}
                        </td>
                        <td className="mono tnum" style={{ ...tdStyle, fontWeight: 600, color: returnColor(fund.percentage_change) }}>
                          {formatReturn(fund.percentage_change)}
                        </td>
                        <td style={tdStyle}>{renderStars(fund.star_rating)}</td>
                        <td className="mono tnum" style={{ ...tdStyle, color: 'var(--ns-text-2)' }}>
                          {formatAssetSize(fund.asset_size)}
                        </td>
                        <td className="mono tnum" style={{ ...tdStyle, color: returnColor(fund['1_month_return']) }}>
                          {formatReturn(fund['1_month_return'])}
                        </td>
                        <td className="mono tnum" style={{ ...tdStyle, color: returnColor(fund['3_month_return']) }}>
                          {formatReturn(fund['3_month_return'])}
                        </td>
                        <td className="mono tnum" style={{ ...tdStyle, color: returnColor(fund['1_year_return']) }}>
                          {formatReturn(fund['1_year_return'])}
                        </td>
                        <td className="mono tnum" style={{ ...tdStyle, color: returnColor(fund['3_year_return']) }}>
                          {formatReturn(fund['3_year_return'])}
                        </td>
                        <td className="mono tnum" style={{ ...tdStyle, color: returnColor(fund['5_year_return']) }}>
                          {formatReturn(fund['5_year_return'])}
                        </td>
                      </tr>

                      {/* Inline detail panel */}
                      {isSelected && (
                        <tr>
                          <td colSpan={10} style={{ padding: 0 }}>
                            {detailLoading ? (
                              <div style={{ padding: '20px 18px', background: 'var(--ns-surface)', borderTop: '1px solid var(--ns-border)' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                  <div>
                                    <div className="ns-skeleton" style={{ width: 120, height: 12, marginBottom: 12 }} />
                                    {[1, 2, 3, 4, 5].map(j => (
                                      <div key={j} style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                                        <div className="ns-skeleton" style={{ width: 80, height: 11 }} />
                                        <div className="ns-skeleton" style={{ width: 100, height: 11 }} />
                                      </div>
                                    ))}
                                  </div>
                                  <div>
                                    <div className="ns-skeleton" style={{ width: 80, height: 12, marginBottom: 12 }} />
                                    {[1, 2, 3, 4, 5].map(j => (
                                      <div key={j} style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                                        <div className="ns-skeleton" style={{ width: 60, height: 11 }} />
                                        <div className="ns-skeleton" style={{ width: 70, height: 11 }} />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ) : fundDetail ? (
                              <DetailPanel detail={fundDetail} fundRow={selectedFundRow} />
                            ) : null}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>

            {funds.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--ns-text-3)', fontSize: 13 }}>
                No funds in this category.
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  /* ---------- Skeletons ---------- */

  const CategoryTabsSkeleton = () => (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="ns-skeleton" style={{ width: 70 + (i % 3) * 20, height: 32, borderRadius: 8 }} />
      ))}
    </div>
  );

  const TableSkeleton = () => (
    <div className="ns-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between' }}>
        <div className="ns-skeleton" style={{ width: 120, height: 14 }} />
        <div className="ns-skeleton" style={{ width: 60, height: 12 }} />
      </div>
      <div style={{ padding: '0 18px 18px' }}>
        {/* Header */}
        <div style={{ display: 'flex', gap: 10, paddingBottom: 10, borderBottom: '1px solid var(--ns-border)' }}>
          <div className="ns-skeleton" style={{ width: 180, height: 10 }} />
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <div key={i} className="ns-skeleton" style={{ width: 50, height: 10, marginLeft: 'auto' }} />
          ))}
        </div>
        {/* Rows */}
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} style={{ display: 'flex', gap: 10, padding: '12px 0', borderBottom: '1px solid var(--ns-border)' }}>
            <div className="ns-skeleton" style={{ width: `${50 + (i % 3) * 10}%`, height: 13 }} />
            {[1, 2, 3, 4, 5, 6, 7].map(j => (
              <div key={j} className="ns-skeleton" style={{ width: 48, height: 13, marginLeft: 'auto' }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  /* ---------- Content ---------- */

  const PREFERRED_TAB_ORDER = ['Equity', 'Hybrid', 'Debt', 'Index Funds', 'Solutions Oriented', 'Global Fund of Funds', 'Other'];
  const categoryKeys = Object.keys(categories).sort((a, b) => {
    const idxA = PREFERRED_TAB_ORDER.indexOf(a);
    const idxB = PREFERRED_TAB_ORDER.indexOf(b);
    // Items in the preferred list come first, in order; unlisted items go to the end
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });
  const subCategoryEntries = getCategoryEntries();

  const content = loading ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="ns-fade-up">
        <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>Mutual Funds</h1>
        <p style={{ fontSize: 13, color: 'var(--ns-text-3)', marginTop: 4 }}>Loading fund data...</p>
      </div>
      <div className="ns-skeleton" style={{ width: '100%', maxWidth: 400, height: 38, borderRadius: 8 }} />
      <CategoryTabsSkeleton />
      <TableSkeleton />
      <TableSkeleton />
    </div>
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Title */}
      <div className="ns-fade-up">
        <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>
          <PiggyBank size={22} style={{ verticalAlign: 'middle', marginRight: 8, opacity: 0.7 }} />
          Mutual Funds
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ns-text-3)', marginTop: 4 }}>Browse funds by category, compare returns</p>
      </div>

      {/* Search */}
      <div ref={searchRef} style={{ position: 'relative', maxWidth: 480 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--ns-surface)', border: '1px solid var(--ns-border)',
          borderRadius: 8, padding: '8px 12px',
          transition: 'border-color 0.15s ease',
        }}>
          <Search size={15} style={{ color: 'var(--ns-text-4)', flexShrink: 0 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search mutual funds by name..."
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'var(--ns-text-1)', fontSize: 13, fontFamily: 'inherit',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setSearchResults([]); setSearchOpen(false); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ns-text-4)', padding: 2 }}
            >
              <X size={14} />
            </button>
          )}
          {searchLoading && (
            <div className="ns-skeleton" style={{ width: 14, height: 14, borderRadius: '50%', flexShrink: 0 }} />
          )}
        </div>

        {/* Search dropdown */}
        {searchOpen && searchResults.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
            marginTop: 4, background: 'var(--ns-bg)', border: '1px solid var(--ns-border)',
            borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            maxHeight: 360, overflowY: 'auto',
          }}>
            {searchResults.map((fund, i) => (
              <div
                key={i}
                style={{
                  padding: '10px 14px', cursor: 'pointer',
                  borderBottom: i < searchResults.length - 1 ? '1px solid var(--ns-border)' : 'none',
                  transition: 'background 0.1s ease',
                }}
                onClick={() => {
                  openFundDetail(fund.fund_name);
                  setSearchOpen(false);
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{fund.fund_name}</div>
                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--ns-text-3)' }}>
                  {fund.latest_nav && <span>NAV: {formatNav(fund.latest_nav)}</span>}
                  {fund.star_rating && <span>{renderStars(fund.star_rating)}</span>}
                  {fund['1_year_return'] && (
                    <span style={{ color: returnColor(fund['1_year_return']) }}>
                      1Y: {formatReturn(fund['1_year_return'])}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search result detail (when selected from search) */}
      {selectedFund && !activeCategory && fundDetail && (
        <div className="ns-card" style={{ padding: 0, overflow: 'hidden' }}>
          <DetailPanel detail={fundDetail} fundRow={selectedFundRow} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="ns-card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={16} style={{ color: 'var(--ns-loss)', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: 'var(--ns-text-2)' }}>{error}</span>
        </div>
      )}

      {/* Category tabs */}
      {categoryKeys.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {categoryKeys.map(cat => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setSelectedFund(null); setSelectedFundRow(null); setFundDetail(null); }}
              style={{
                padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', border: '1px solid var(--ns-border)', fontFamily: 'inherit',
                background: activeCategory === cat ? 'var(--ns-accent-soft)' : 'var(--ns-surface)',
                color: activeCategory === cat ? 'var(--ns-accent)' : 'var(--ns-text-3)',
                transition: 'all 0.15s ease',
              }}
            >{cat}</button>
          ))}
        </div>
      )}

      {/* Sub-category tables */}
      {subCategoryEntries.length > 0 ? (
        subCategoryEntries.map(([subCat, funds]) => (
          <FundTable key={`${activeCategory}-${subCat}`} funds={funds} subCategory={subCat} />
        ))
      ) : (
        !error && categoryKeys.length > 0 && (
          <div className="ns-card" style={{ padding: 24, textAlign: 'center', color: 'var(--ns-text-3)', fontSize: 13 }}>
            No funds found in "{activeCategory}".
          </div>
        )
      )}
    </div>
  );

  /* ---------- Render ---------- */

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

export default MutualFunds;
