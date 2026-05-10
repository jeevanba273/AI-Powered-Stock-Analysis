import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';

interface CorporateAction {
  date?: string;
  exDate?: string;
  type?: string;
  action?: string;
  details?: string;
  description?: string;
  value?: string | number;
  [key: string]: any;
}

interface CorporateActionsProps {
  ticker: string;
  className?: string;
}

const getActionType = (action: CorporateAction): string => {
  const raw = (action.type || action.action || action.description || '').toLowerCase();
  if (raw.includes('dividend') || raw.includes('div')) return 'dividend';
  if (raw.includes('split')) return 'split';
  if (raw.includes('bonus')) return 'bonus';
  if (raw.includes('buyback')) return 'buyback';
  if (raw.includes('rights')) return 'rights';
  return 'other';
};

const typeConfig: Record<string, { color: string; bg: string; label: string }> = {
  dividend: { color: 'var(--ns-profit)', bg: 'oklch(0.78 0.17 155 / 0.1)', label: 'Dividend' },
  split:    { color: 'var(--ns-accent)', bg: 'oklch(0.82 0.13 195 / 0.1)', label: 'Split' },
  bonus:    { color: 'var(--ns-accent-2)', bg: 'oklch(0.72 0.16 270 / 0.1)', label: 'Bonus' },
  buyback:  { color: 'oklch(0.75 0.12 60)', bg: 'oklch(0.75 0.12 60 / 0.1)', label: 'Buyback' },
  rights:   { color: 'oklch(0.72 0.14 200)', bg: 'oklch(0.72 0.14 200 / 0.1)', label: 'Rights' },
  other:    { color: 'var(--ns-text-3)', bg: 'var(--ns-surface)', label: 'Action' },
};

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

const CorporateActions: React.FC<CorporateActionsProps> = ({ ticker, className }) => {
  const [actions, setActions] = useState<CorporateAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setActions([]);

    fetch(`/api/proxy/dev/corporate_actions?stock_name=${encodeURIComponent(ticker)}`)
      .then(res => {
        if (!res.ok) throw new Error('fetch failed');
        return res.json();
      })
      .then(json => {
        if (!cancelled) {
          const items = Array.isArray(json) ? json : (json?.data || json?.actions || []);
          setActions(items);
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

  return (
    <div className={`ns-card ${className || ''}`} style={{ padding: 18 }}>
      <div className="ns-card-header">
        <div className="ns-card-title"><FileText size={14} /> Corporate Actions</div>
        <div style={{ fontSize: 10.5, color: 'var(--ns-text-4)', letterSpacing: '0.06em' }}>
          {actions.length} {actions.length === 1 ? 'ACTION' : 'ACTIONS'}
        </div>
      </div>

      {actions.length === 0 ? (
        <div style={{ marginTop: 14, padding: '20px 0', textAlign: 'center', fontSize: 12.5, color: 'var(--ns-text-4)' }}>
          No corporate actions found
        </div>
      ) : (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 0 }}>
          {actions.slice(0, 15).map((action, i) => {
            const actionType = getActionType(action);
            const config = typeConfig[actionType];
            const date = action.date || action.exDate || action.ex_date || action.recordDate;
            const detail = action.details || action.description || action.subject || action.action || '';
            const value = action.value || action.amount || action.ratio || '';

            return (
              <div
                key={i}
                style={{
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  padding: '10px 0',
                  borderBottom: i < Math.min(actions.length, 15) - 1 ? '1px solid var(--ns-border)' : 'none',
                  animation: `ns-fade-up 0.4s ${0.03 * i}s backwards`,
                }}
              >
                {/* Timeline dot */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 70, paddingTop: 2 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: config.color, flexShrink: 0 }} />
                  <div className="mono" style={{ fontSize: 10.5, color: 'var(--ns-text-4)', marginTop: 4, textAlign: 'center' }}>
                    {formatDate(date)}
                  </div>
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
                      padding: '2px 6px', borderRadius: 4,
                      background: config.bg, color: config.color,
                    }}>
                      {config.label}
                    </span>
                    {value && (
                      <span className="mono tnum" style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ns-text-2)' }}>
                        {String(value)}
                      </span>
                    )}
                  </div>
                  {detail && (
                    <div style={{ fontSize: 12, color: 'var(--ns-text-3)', marginTop: 4, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {detail}
                    </div>
                  )}
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
