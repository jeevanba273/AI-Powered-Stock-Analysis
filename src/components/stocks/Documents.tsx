import React, { useState, useEffect } from 'react';
import { FileStack, Mic, BookOpen, Bell, ExternalLink } from 'lucide-react';

interface DocItem {
  title?: string;
  name?: string;
  subject?: string;
  date?: string;
  publishedDate?: string;
  filingDate?: string;
  url?: string;
  link?: string;
  pdfLink?: string;
  attachment_url?: string;
  // concall fields
  transcript?: string;
  'ai summary'?: string;
  ppt?: string;
  rec?: string;
  // annual report fields
  year?: string;
  source?: string;
  [key: string]: any;
}

interface DocumentsProps {
  ticker: string;
  className?: string;
}

type TabKey = 'concalls' | 'annual' | 'announcements';

const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr) return '--';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

const getTitle = (item: DocItem, tab: TabKey): string => {
  if (tab === 'concalls') {
    return item.date || 'Untitled';
  }
  if (tab === 'annual') {
    const year = item.year || '';
    const source = item.source || '';
    if (year) return `Annual Report ${year}${source ? ` (${source})` : ''}`;
    return 'Untitled';
  }
  return String(item.title || item.name || item.subject || item.description || item.heading || 'Untitled');
};

const getDate = (item: DocItem, tab: TabKey): string => {
  // For concalls and annual reports, date/year is already in the title
  if (tab === 'concalls' || tab === 'annual') return '';
  return item.date || item.publishedDate || item.filingDate || item.created_at || item.an_dt || '';
};

const getUrl = (item: DocItem): string | null => {
  return item.url || item.link || item.pdfLink || item.attachment_url || item.attchmntFile || null;
};

const getConcallLinks = (item: DocItem): { label: string; url: string }[] => {
  const links: { label: string; url: string }[] = [];
  if (item.transcript) links.push({ label: 'Transcript', url: item.transcript });
  if (item.ppt) links.push({ label: 'PPT', url: item.ppt });
  if (item.rec) links.push({ label: 'Recording', url: item.rec });
  return links;
};

const parseItems = (json: any): DocItem[] => {
  if (!json) return [];
  if (Array.isArray(json)) return json;
  if (json.data && Array.isArray(json.data)) return json.data;
  if (json.items && Array.isArray(json.items)) return json.items;
  if (json.results && Array.isArray(json.results)) return json.results;
  return [];
};

const tabMeta: Record<TabKey, { label: string; icon: React.ReactNode }> = {
  concalls:      { label: 'Conference Calls', icon: <Mic size={12} /> },
  annual:        { label: 'Annual Reports',   icon: <BookOpen size={12} /> },
  announcements: { label: 'Announcements',    icon: <Bell size={12} /> },
};

const Documents: React.FC<DocumentsProps> = ({ ticker, className }) => {
  const [concalls, setConcalls] = useState<DocItem[]>([]);
  const [annual, setAnnual] = useState<DocItem[]>([]);
  const [announcements, setAnnouncements] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('concalls');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setConcalls([]);
    setAnnual([]);
    setAnnouncements([]);

    const encoded = encodeURIComponent(ticker);

    Promise.all([
      fetch(`/api/proxy/dev/concalls?stock_name=${encoded}`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`/api/proxy/dev/annual_reports?stock_name=${encoded}`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`/api/proxy/dev/recent_announcements?stock_name=${encoded}`).then(r => r.ok ? r.json() : null).catch(() => null),
    ])
      .then(([cc, ar, an]) => {
        if (!cancelled) {
          setConcalls(parseItems(cc));
          setAnnual(parseItems(ar));
          setAnnouncements(parseItems(an));
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [ticker]);

  if (error) return null;

  if (loading) {
    return (
      <div className={`ns-card ${className || ''}`} style={{ padding: 18 }}>
        <div className="ns-card-header">
          <div className="ns-card-title"><FileStack size={14} /> Documents & Filings</div>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="ns-skeleton" style={{ width: 100, height: 28, borderRadius: 8 }} />
          ))}
        </div>
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--ns-surface)', border: '1px solid var(--ns-border)' }}>
              <div className="ns-skeleton" style={{ width: `${60 + (i % 3) * 12}%`, height: 12 }} />
              <div className="ns-skeleton" style={{ width: 80, height: 10, marginTop: 6 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const dataMap: Record<TabKey, DocItem[]> = {
    concalls,
    annual,
    announcements,
  };

  const activeItems = dataMap[activeTab];

  const tabCounts: Record<TabKey, number> = {
    concalls: concalls.length,
    annual: annual.length,
    announcements: announcements.length,
  };

  return (
    <div className={`ns-card ${className || ''}`} style={{ padding: 18 }}>
      <div className="ns-card-header">
        <div className="ns-card-title"><FileStack size={14} /> Documents & Filings</div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginTop: 14, padding: 3, background: 'var(--ns-surface)', border: '1px solid var(--ns-border)', borderRadius: 10 }}>
        {(Object.keys(tabMeta) as TabKey[]).map(key => {
          const isActive = activeTab === key;
          return (
            <div
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                flex: 1, padding: '7px 10px', borderRadius: 7, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                fontSize: 11, fontWeight: 600, letterSpacing: '0.02em',
                color: isActive ? 'var(--ns-accent)' : 'var(--ns-text-3)',
                background: isActive ? 'var(--ns-accent-soft)' : 'transparent',
                transition: 'all 0.15s ease',
              }}
            >
              {tabMeta[key].icon}
              <span>{tabMeta[key].label}</span>
              {tabCounts[key] > 0 && (
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 99,
                  background: isActive ? 'var(--ns-accent)' : 'var(--ns-surface-hi)',
                  color: isActive ? 'var(--ns-bg)' : 'var(--ns-text-4)',
                  marginLeft: 2,
                }}>
                  {tabCounts[key]}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ marginTop: 12 }}>
        {activeItems.length === 0 ? (
          <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 12.5, color: 'var(--ns-text-4)' }}>
            No {tabMeta[activeTab].label.toLowerCase()} found
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {activeItems.slice(0, 20).map((item, i) => {
              const title = getTitle(item, activeTab);
              const date = getDate(item, activeTab);
              const url = getUrl(item);
              const concallLinks = activeTab === 'concalls' ? getConcallLinks(item) : [];
              const hasConcallLinks = concallLinks.length > 0;

              return (
                <div
                  key={i}
                  onClick={() => { if (!hasConcallLinks && url) window.open(url, '_blank'); }}
                  style={{
                    padding: '10px 12px', borderRadius: 10,
                    background: 'var(--ns-surface)', border: '1px solid var(--ns-border)',
                    cursor: (!hasConcallLinks && url) ? 'pointer' : 'default',
                    transition: 'all 0.15s ease',
                    animation: `ns-fade-up 0.4s ${0.03 * i}s backwards`,
                  }}
                  onMouseEnter={e => {
                    if (!hasConcallLinks && url) {
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--ns-border-strong)';
                      (e.currentTarget as HTMLElement).style.background = 'var(--ns-surface-2)';
                    }
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--ns-border)';
                    (e.currentTarget as HTMLElement).style.background = 'var(--ns-surface)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 12.5, fontWeight: 600, color: 'var(--ns-text-2)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {title}
                      </div>
                      {date && (
                        <div className="mono" style={{ fontSize: 10.5, color: 'var(--ns-text-4)', marginTop: 3 }}>
                          {formatDate(date)}
                        </div>
                      )}
                      {hasConcallLinks && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
                          {concallLinks.map((link, j) => (
                            <a
                              key={j}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              style={{
                                fontSize: 10.5, fontWeight: 600, color: 'var(--ns-accent)',
                                textDecoration: 'none', padding: '2px 8px', borderRadius: 6,
                                background: 'var(--ns-accent-soft)', display: 'inline-flex',
                                alignItems: 'center', gap: 3,
                              }}
                            >
                              {link.label} <ExternalLink size={9} />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    {!hasConcallLinks && url && (
                      <ExternalLink size={12} style={{ color: 'var(--ns-text-4)', flexShrink: 0, marginTop: 2 }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Documents;
