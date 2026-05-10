import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';

interface CategoryData {
  msg: string;
  title: string;
  header: string[];
  data: string[][];
}

interface CorporateActionsData {
  [key: string]: CategoryData;
}

interface CorporateActionsProps {
  ticker: string;
  className?: string;
}

const categoryOrder = ['dividends', 'board_meetings', 'bonus', 'splits', 'rights'];

const categoryConfig: Record<string, { color: string; bg: string }> = {
  dividends:      { color: 'var(--ns-profit)', bg: 'oklch(0.78 0.17 155 / 0.1)' },
  board_meetings: { color: 'var(--ns-accent)', bg: 'oklch(0.82 0.13 195 / 0.1)' },
  bonus:          { color: 'var(--ns-accent-2)', bg: 'oklch(0.72 0.16 270 / 0.1)' },
  splits:         { color: 'oklch(0.75 0.12 60)', bg: 'oklch(0.75 0.12 60 / 0.1)' },
  rights:         { color: 'oklch(0.72 0.14 200)', bg: 'oklch(0.72 0.14 200 / 0.1)' },
};

const CorporateActions: React.FC<CorporateActionsProps> = ({ ticker, className }) => {
  const [data, setData] = useState<CorporateActionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setData(null);

    fetch(`/api/proxy/dev/corporate_actions?stock_name=${encodeURIComponent(ticker)}`)
      .then(res => {
        if (!res.ok) throw new Error('fetch failed');
        return res.json();
      })
      .then(json => {
        if (!cancelled) {
          // The API returns an object with category keys
          if (json && typeof json === 'object' && !Array.isArray(json)) {
            setData(json as CorporateActionsData);
          } else {
            setData(null);
          }
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
          <div className="ns-card-title"><FileText size={14} /> Corporate Actions</div>
        </div>
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div className="ns-skeleton" style={{ width: 60, height: 12 }} />
              <div style={{ flex: 1 }}>
                <div className="ns-skeleton" style={{ width: `${70 + (i % 3) * 10}%`, height: 12 }} />
                <div className="ns-skeleton" style={{ width: '40%', height: 10, marginTop: 4 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Gather categories that have data
  const categories = data
    ? categoryOrder
        .filter(key => data[key] && data[key].data && data[key].data.length > 0)
        .concat(
          Object.keys(data).filter(
            key => !categoryOrder.includes(key) && data[key]?.data?.length > 0
          )
        )
    : [];

  const totalActions = categories.reduce((sum, key) => sum + (data?.[key]?.data?.length || 0), 0);

  return (
    <div className={`ns-card ${className || ''}`} style={{ padding: 18 }}>
      <div className="ns-card-header">
        <div className="ns-card-title"><FileText size={14} /> Corporate Actions</div>
        {totalActions > 0 && (
          <div style={{ fontSize: 10.5, color: 'var(--ns-text-4)', letterSpacing: '0.06em' }}>
            {totalActions} {totalActions === 1 ? 'ACTION' : 'ACTIONS'}
          </div>
        )}
      </div>

      {categories.length === 0 ? (
        <div style={{ marginTop: 14, padding: '20px 0', textAlign: 'center', fontSize: 12.5, color: 'var(--ns-text-4)' }}>
          No corporate actions found
        </div>
      ) : (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {categories.map((catKey, ci) => {
            const category = data![catKey];
            const config = categoryConfig[catKey] || { color: 'var(--ns-text-3)', bg: 'var(--ns-surface)' };
            const sectionTitle = category.title || catKey.replace(/_/g, ' ');
            const headers = category.header || [];
            const rows = category.data || [];

            return (
              <div key={catKey} style={{ animation: `ns-fade-up 0.4s ${0.05 * ci}s backwards` }}>
                {/* Section header */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: config.color, flexShrink: 0 }} />
                  <span style={{
                    fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
                    color: config.color,
                  }}>
                    {sectionTitle}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--ns-text-4)' }}>({rows.length})</span>
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                    {headers.length > 0 && (
                      <thead>
                        <tr>
                          {headers.map((h, hi) => {
                            const isLast = hi === headers.length - 1;
                            const isDate = h.toLowerCase().includes('date');
                            return (
                              <th key={hi} style={{
                                fontSize: 10, fontWeight: 600, color: 'var(--ns-text-4)', textTransform: 'uppercase',
                                letterSpacing: '0.06em', padding: '5px 8px',
                                textAlign: isLast ? 'center' : 'left',
                                borderBottom: '1px solid var(--ns-border)', whiteSpace: 'nowrap',
                                width: isDate ? 95 : isLast ? undefined : 'auto',
                              }}>
                                {h}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                    )}
                    <tbody>
                      {rows.slice(0, 10).map((row, ri) => (
                        <tr key={ri} style={{ animation: `ns-fade-up 0.3s ${0.03 * ri}s backwards` }}>
                          {row.map((cell, cellIdx) => {
                            const isLast = cellIdx === row.length - 1;
                            const text = cell || '--';
                            return (
                              <td key={cellIdx} style={{
                                fontSize: 12, padding: '6px 8px', color: 'var(--ns-text-3)',
                                borderBottom: ri < Math.min(rows.length, 10) - 1 ? '1px solid var(--ns-border)' : 'none',
                                whiteSpace: isLast ? 'normal' : 'nowrap',
                                lineHeight: isLast ? 1.4 : undefined,
                                wordBreak: isLast ? 'break-word' : undefined,
                                textAlign: isLast ? 'center' : 'left',
                                verticalAlign: 'top',
                              }}>
                                {isLast && text.length > 120 ? text.slice(0, 120) + '...' : text}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CorporateActions;
