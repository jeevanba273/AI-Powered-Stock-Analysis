import React, { useState, useEffect } from 'react';
import { BarChart3 } from 'lucide-react';

interface ForecastRow {
  year: string;
  actual: number | null;
  estimate: number | null;
  surprise: number | null;
  numEstimates: number;
}

interface ForecastsProps {
  ticker: string;
  className?: string;
}

const parseForecasts = (json: any): ForecastRow[] => {
  if (!json) return [];

  // Handle the actual API structure: { measureCode, measureName, periods: [...] }
  let periods: any[] = [];
  if (json.periods && Array.isArray(json.periods)) {
    periods = json.periods;
  } else if (Array.isArray(json)) {
    // If the response is an array of measure objects, use the first one
    const first = json.find((m: any) => m.periods && Array.isArray(m.periods));
    if (first) periods = first.periods;
  } else if (json.data && Array.isArray(json.data)) {
    // Possibly wrapped in data
    const first = json.data.find((m: any) => m.periods && Array.isArray(m.periods));
    if (first) periods = first.periods;
    else if (json.data.length > 0 && json.data[0].FiscalPeriod) periods = json.data;
  }

  if (periods.length === 0) return [];

  return periods.map((p: any) => {
    const fp = p.FiscalPeriod || {};
    const type = fp.Type || 'FY';
    const year = fp.Year != null ? `${type} ${fp.Year}` : '--';

    let actual: number | null = null;
    let surprise: number | null = null;
    let numEstimatesActual = 0;
    if (p.Actuals && p.Actuals.Actual && Array.isArray(p.Actuals.Actual) && p.Actuals.Actual.length > 0) {
      const a = p.Actuals.Actual[0];
      actual = a.Reported != null ? Number(a.Reported) : null;
      surprise = a.SurprisePercent != null ? Number(a.SurprisePercent) : null;
      numEstimatesActual = Number(a.NumberOfEstimates || 0);
    }

    let estimate: number | null = null;
    let numEstimatesEst = 0;
    if (p.Estimates) {
      estimate = p.Estimates.EstimateMean != null ? Number(p.Estimates.EstimateMean) : null;
      numEstimatesEst = Number(p.Estimates.NumberOfEstimates || 0);
    }

    return {
      year,
      actual,
      estimate,
      surprise,
      numEstimates: numEstimatesEst || numEstimatesActual,
    };
  });
};

const formatNum = (v: number | null): string => {
  if (v == null || isNaN(v)) return '--';
  if (Math.abs(v) >= 1e9) return (v / 1e9).toFixed(2) + 'B';
  if (Math.abs(v) >= 1e7) return (v / 1e7).toFixed(2) + 'Cr';
  if (Math.abs(v) >= 1e5) return (v / 1e5).toFixed(2) + 'L';
  if (Math.abs(v) >= 1e3) return (v / 1e3).toFixed(1) + 'K';
  return v.toFixed(2);
};

const ForecastTable: React.FC<{ title: string; data: ForecastRow[] }> = ({ title, data }) => {
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

  const thStyle: React.CSSProperties = {
    fontSize: 10, fontWeight: 600, color: 'var(--ns-text-4)', textTransform: 'uppercase',
    letterSpacing: '0.06em', padding: '6px 8px', textAlign: 'right', borderBottom: '1px solid var(--ns-border)',
  };
  const tdStyle: React.CSSProperties = {
    fontSize: 12, padding: '7px 8px', textAlign: 'right', borderBottom: '1px solid var(--ns-border)',
  };

  return (
    <div style={{ padding: '12px 0' }}>
      <div style={{ fontSize: 11, color: 'var(--ns-text-4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 10 }}>
        {title}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, textAlign: 'left' }}>Year</th>
              <th style={thStyle}>Actual</th>
              <th style={thStyle}>Estimate</th>
              <th style={thStyle}>Surprise</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 8).map((row, i) => {
              const surpriseColor = row.surprise != null
                ? (row.surprise >= 0 ? 'var(--ns-profit)' : 'var(--ns-loss)')
                : 'var(--ns-text-4)';
              return (
                <tr key={i} style={{ animation: `ns-fade-up 0.4s ${0.04 * i}s backwards` }}>
                  <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 600, color: 'var(--ns-text-3)' }}>
                    <span className="mono">{row.year}</span>
                    {row.numEstimates > 0 && (
                      <span style={{ fontSize: 9.5, color: 'var(--ns-text-4)', marginLeft: 4 }}>({row.numEstimates}est)</span>
                    )}
                  </td>
                  <td className="mono tnum" style={{ ...tdStyle, fontWeight: 600, color: row.actual != null ? 'var(--ns-text-2)' : 'var(--ns-text-4)' }}>
                    {formatNum(row.actual)}
                  </td>
                  <td className="mono tnum" style={{ ...tdStyle, color: row.estimate != null ? 'var(--ns-text-3)' : 'var(--ns-text-4)' }}>
                    {formatNum(row.estimate)}
                  </td>
                  <td className="mono tnum" style={{ ...tdStyle, fontWeight: 600, color: surpriseColor }}>
                    {row.surprise != null ? `${row.surprise >= 0 ? '+' : ''}${row.surprise.toFixed(1)}%` : '--'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Forecasts: React.FC<ForecastsProps> = ({ ticker, className }) => {
  const [epsData, setEpsData] = useState<ForecastRow[]>([]);
  const [revData, setRevData] = useState<ForecastRow[]>([]);
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

      <ForecastTable title="EPS Estimates" data={epsData} />

      {epsData.length > 0 && revData.length > 0 && (
        <div style={{ height: 1, background: 'var(--ns-border)', margin: '4px 0' }} />
      )}

      <ForecastTable title="Revenue Estimates" data={revData} />
    </div>
  );
};

export default Forecasts;
