import React, { useState, useEffect } from 'react';
import { BarChart3 } from 'lucide-react';

interface ForecastEntry {
  period?: string;
  year?: string | number;
  fiscalYear?: string;
  mean?: number;
  high?: number;
  low?: number;
  median?: number;
  numberOfEstimates?: number;
  [key: string]: any;
}

interface ForecastsProps {
  ticker: string;
  className?: string;
}

const parseForecasts = (json: any): ForecastEntry[] => {
  if (!json) return [];
  if (Array.isArray(json)) return json;
  if (json.data && Array.isArray(json.data)) return json.data;
  if (json.estimates && Array.isArray(json.estimates)) return json.estimates;
  if (json.forecasts && Array.isArray(json.forecasts)) return json.forecasts;
  // If it's an object with year keys, convert to array
  if (typeof json === 'object' && !Array.isArray(json)) {
    const keys = Object.keys(json).filter(k => /^\d{4}/.test(k) || /^FY/.test(k));
    if (keys.length > 0) {
      return keys.map(k => ({ period: k, ...( typeof json[k] === 'object' ? json[k] : { mean: Number(json[k]) || 0 } ) }));
    }
  }
  return [];
};

const formatNum = (v: any): string => {
  const n = Number(v);
  if (isNaN(n)) return '--';
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (Math.abs(n) >= 1e7) return (n / 1e7).toFixed(2) + 'Cr';
  if (Math.abs(n) >= 1e5) return (n / 1e5).toFixed(2) + 'L';
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(2) + 'K';
  return n.toFixed(2);
};

const getPeriodLabel = (entry: ForecastEntry): string => {
  return String(entry.period || entry.year || entry.fiscalYear || entry.endDate || '--');
};

const ForecastSection: React.FC<{ title: string; data: ForecastEntry[]; unit: string }> = ({ title, data, unit }) => {
  if (data.length === 0) {
    return (
      <div style={{ padding: '12px 0' }}>
        <div style={{ fontSize: 11, color: 'var(--ns-text-4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 8 }}>
          {title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ns-text-4)', padding: '8px 0' }}>No data available</div>
      </div>
    );
  }

  // Find the max absolute mean value for bar scaling
  const values = data.map(e => Math.abs(Number(e.mean || e.value || e.estimate || 0)));
  const maxVal = Math.max(...values, 1);

  return (
    <div style={{ padding: '12px 0' }}>
      <div style={{ fontSize: 11, color: 'var(--ns-text-4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 10 }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {data.slice(0, 6).map((entry, i) => {
          const meanVal = Number(entry.mean || entry.value || entry.estimate || 0);
          const barPct = maxVal > 0 ? (Math.abs(meanVal) / maxVal) * 100 : 0;
          const isPositive = meanVal >= 0;
          const period = getPeriodLabel(entry);
          const numEstimates = Number(entry.numberOfEstimates || entry.numEstimates || entry.count || 0);

          return (
            <div key={i} style={{ animation: `ns-fade-up 0.4s ${0.04 * i}s backwards` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <span className="mono" style={{ fontSize: 11, color: 'var(--ns-text-3)', fontWeight: 600 }}>{period}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="mono tnum" style={{ fontSize: 12.5, fontWeight: 600, color: isPositive ? 'var(--ns-profit)' : 'var(--ns-loss)' }}>
                    {formatNum(meanVal)} {unit}
                  </span>
                  {numEstimates > 0 && (
                    <span style={{ fontSize: 10, color: 'var(--ns-text-4)' }}>({numEstimates})</span>
                  )}
                </div>
              </div>
              <div style={{ height: 4, borderRadius: 99, background: 'var(--ns-surface-hi)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 99,
                  width: `${Math.max(2, barPct)}%`,
                  background: isPositive ? 'var(--ns-profit)' : 'var(--ns-loss)',
                  opacity: 0.6,
                  transition: 'width 0.6s ease',
                }} />
              </div>
              {/* High/Low range if available */}
              {(entry.high != null || entry.low != null) && (
                <div style={{ display: 'flex', gap: 12, marginTop: 2 }}>
                  {entry.low != null && (
                    <span style={{ fontSize: 10, color: 'var(--ns-text-4)' }}>
                      L: <span className="mono">{formatNum(entry.low)}</span>
                    </span>
                  )}
                  {entry.high != null && (
                    <span style={{ fontSize: 10, color: 'var(--ns-text-4)' }}>
                      H: <span className="mono">{formatNum(entry.high)}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Forecasts: React.FC<ForecastsProps> = ({ ticker, className }) => {
  const [epsData, setEpsData] = useState<ForecastEntry[]>([]);
  const [revData, setRevData] = useState<ForecastEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setEpsData([]);
    setRevData([]);

    const encodedTicker = encodeURIComponent(ticker);
    const epsUrl = `/api/proxy/dev/stock_forecasts?stock_id=${encodedTicker}&measure_code=EPS&period_type=Annual&data_type=Estimates&age=Current`;
    const revUrl = `/api/proxy/dev/stock_forecasts?stock_id=${encodedTicker}&measure_code=SAL&period_type=Annual&data_type=Estimates&age=Current`;

    Promise.all([
      fetch(epsUrl).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(revUrl).then(r => r.ok ? r.json() : null).catch(() => null),
    ])
      .then(([epsJson, revJson]) => {
        if (!cancelled) {
          setEpsData(parseForecasts(epsJson));
          setRevData(parseForecasts(revJson));
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
          <div className="ns-card-title"><BarChart3 size={14} /> Analyst Forecasts</div>
        </div>
        <div style={{ marginTop: 14 }}>
          <div className="ns-skeleton" style={{ width: '40%', height: 10, marginBottom: 12 }} />
          {[1, 2, 3].map(i => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div className="ns-skeleton" style={{ width: 50, height: 10 }} />
                <div className="ns-skeleton" style={{ width: 70, height: 10 }} />
              </div>
              <div className="ns-skeleton" style={{ width: `${50 + i * 15}%`, height: 4, marginTop: 4, borderRadius: 99 }} />
            </div>
          ))}
          <div className="ns-skeleton" style={{ width: '40%', height: 10, marginTop: 16, marginBottom: 12 }} />
          {[1, 2, 3].map(i => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div className="ns-skeleton" style={{ width: 50, height: 10 }} />
                <div className="ns-skeleton" style={{ width: 70, height: 10 }} />
              </div>
              <div className="ns-skeleton" style={{ width: `${40 + i * 20}%`, height: 4, marginTop: 4, borderRadius: 99 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // If both are empty, still show the card with empty message
  if (epsData.length === 0 && revData.length === 0) {
    return (
      <div className={`ns-card ${className || ''}`} style={{ padding: 18 }}>
        <div className="ns-card-header">
          <div className="ns-card-title"><BarChart3 size={14} /> Analyst Forecasts</div>
        </div>
        <div style={{ marginTop: 14, padding: '20px 0', textAlign: 'center', fontSize: 12.5, color: 'var(--ns-text-4)' }}>
          No forecast data available
        </div>
      </div>
    );
  }

  return (
    <div className={`ns-card ${className || ''}`} style={{ padding: 18 }}>
      <div className="ns-card-header">
        <div className="ns-card-title"><BarChart3 size={14} /> Analyst Forecasts</div>
      </div>

      <ForecastSection title="EPS Estimates" data={epsData} unit="" />

      {epsData.length > 0 && revData.length > 0 && (
        <div style={{ height: 1, background: 'var(--ns-border)', margin: '4px 0' }} />
      )}

      <ForecastSection title="Revenue Estimates" data={revData} unit="" />
    </div>
  );
};

export default Forecasts;
