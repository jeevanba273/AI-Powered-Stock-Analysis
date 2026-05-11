import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { fetchJsonRetry } from '@/lib/fetchRetry';

interface EarningEvent {
  ticker: string;
  date: string;
  agenda: string;
}

const WATCHLIST_STOCKS = [
  'TCS', 'RELIANCE', 'INFY', 'HDFCBANK',
  'ICICIBANK', 'SBIN', 'TATAMOTORS', 'BHARTIARTL',
];

const EarningsCalendar: React.FC<{ className?: string }> = ({ className }) => {
  const [events, setEvents] = useState<EarningEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      const results: EarningEvent[] = [];

      await Promise.allSettled(
        WATCHLIST_STOCKS.map(async (ticker) => {
          try {
            const json = await fetchJsonRetry(
              `/api/proxy/dev/corporate_actions?stock_name=${encodeURIComponent(ticker)}`
            );
            if (!json) return;

            const meetings = json?.board_meetings;
            if (!meetings?.data || !Array.isArray(meetings.data)) return;

            for (const row of meetings.data) {
              const dateStr = row[0];
              const agenda = row[1] || 'Board Meeting';
              if (!dateStr) continue;
              results.push({ ticker, date: dateStr, agenda });
            }
          } catch {
            // silently skip failures
          }
        })
      );

      if (!cancelled) {
        // Filter: only future dates and past 30 days
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);

        const filtered = results.filter((ev) => {
          const d = parseDate(ev.date);
          return d !== null && d >= thirtyDaysAgo;
        });

        filtered.sort((a, b) => {
          const da = parseDate(a.date);
          const db = parseDate(b.date);
          if (!da || !db) return 0;
          return da.getTime() - db.getTime();
        });

        setEvents(filtered);
        setLoading(false);
      }
    };

    fetchAll();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className={`ns-card ${className || ''}`} style={{ padding: 18 }}>
        <div className="ns-card-header">
          <div className="ns-card-title"><Calendar size={14} /> Earnings Calendar</div>
        </div>
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div className="ns-skeleton" style={{ width: 70, height: 12 }} />
              <div className="ns-skeleton" style={{ width: 90, height: 12 }} />
              <div className="ns-skeleton" style={{ width: 140, height: 12 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`ns-card ${className || ''}`} style={{ padding: 18 }}>
      <div className="ns-card-header">
        <div className="ns-card-title"><Calendar size={14} /> Earnings Calendar</div>
        {events.length > 0 && (
          <div style={{ fontSize: 10.5, color: 'var(--ns-text-4)', letterSpacing: '0.06em' }}>
            {events.length} {events.length === 1 ? 'EVENT' : 'EVENTS'}
          </div>
        )}
      </div>

      {events.length === 0 ? (
        <div style={{ marginTop: 14, padding: '20px 0', textAlign: 'center', fontSize: 12.5, color: 'var(--ns-text-4)' }}>
          No upcoming earnings events found
        </div>
      ) : (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Header row */}
          <div style={{
            display: 'grid', gridTemplateColumns: '90px 120px 1fr',
            gap: 12, padding: '6px 8px',
            fontSize: 10, fontWeight: 600, color: 'var(--ns-text-4)',
            textTransform: 'uppercase', letterSpacing: '0.06em',
            borderBottom: '1px solid var(--ns-border)',
          }}>
            <span>Stock</span>
            <span>Date</span>
            <span>Agenda</span>
          </div>

          {events.map((ev, i) => {
            const d = parseDate(ev.date);
            const now = new Date();
            const isFuture = d ? d >= now : false;

            return (
              <div
                key={`${ev.ticker}-${ev.date}-${i}`}
                style={{
                  display: 'grid', gridTemplateColumns: '90px 120px 1fr',
                  gap: 12, padding: '9px 8px',
                  borderBottom: i < events.length - 1 ? '1px solid var(--ns-border)' : 'none',
                  animation: `ns-fade-up 0.3s ${0.03 * i}s backwards`,
                  opacity: isFuture ? 1 : 0.55,
                }}
              >
                <span style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: '-0.01em' }}>
                  {ev.ticker}
                </span>
                <span className="mono tnum" style={{ fontSize: 12, color: 'var(--ns-text-2)' }}>
                  {formatDisplayDate(ev.date)}
                </span>
                <span style={{
                  fontSize: 12, color: 'var(--ns-text-3)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {ev.agenda.length > 80 ? ev.agenda.slice(0, 80) + '...' : ev.agenda}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/** Parse date strings like "09 Apr 2026" or "2026-04-09" */
function parseDate(str: string): Date | null {
  if (!str) return null;
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d;
  // Try "DD Mon YYYY" format
  const parts = str.trim().split(/[\s-]+/);
  if (parts.length >= 3) {
    const attempt = new Date(`${parts[1]} ${parts[0]}, ${parts[2]}`);
    if (!isNaN(attempt.getTime())) return attempt;
  }
  return null;
}

/** Format date for display: "Apr 9, 2026" */
function formatDisplayDate(str: string): string {
  const d = parseDate(str);
  if (!d) return str;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default EarningsCalendar;
