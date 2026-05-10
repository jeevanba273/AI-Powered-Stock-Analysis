import React, { useState, useEffect } from 'react';
import { Target } from 'lucide-react';

interface PriceTarget {
  Mean: number;
  High: number;
  Low: number;
  NumberOfEstimates: number;
  Median: number;
}

interface Recommendation {
  Mean: number;
}

interface TargetData {
  priceTarget: PriceTarget;
  recommendation: Recommendation;
}

interface AnalystTargetsProps {
  ticker: string;
  currentPrice?: number;
  className?: string;
}

const getRecLabel = (mean: number): string => {
  if (mean <= 1.5) return 'Strong Buy';
  if (mean <= 2.5) return 'Buy';
  if (mean <= 3.5) return 'Hold';
  if (mean <= 4.5) return 'Underperform';
  return 'Sell';
};

const getRecColor = (mean: number): string => {
  if (mean <= 1.5) return 'var(--ns-profit)';
  if (mean <= 2.5) return 'oklch(0.78 0.14 155)';
  if (mean <= 3.5) return 'var(--ns-accent)';
  if (mean <= 4.5) return 'oklch(0.72 0.16 50)';
  return 'var(--ns-loss)';
};

const AnalystTargets: React.FC<AnalystTargetsProps> = ({ ticker, currentPrice, className }) => {
  const [data, setData] = useState<TargetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setData(null);

    fetch(`/api/proxy/dev/stock_target_price?stock_id=${encodeURIComponent(ticker)}`)
      .then(res => {
        if (!res.ok) throw new Error('fetch failed');
        return res.json();
      })
      .then(json => {
        if (!cancelled) {
          setData(json);
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
          <div className="ns-card-title"><Target size={14} /> Analyst Price Targets</div>
        </div>
        <div style={{ marginTop: 14 }}>
          <div className="ns-skeleton" style={{ width: '100%', height: 6, borderRadius: 99 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <div className="ns-skeleton" style={{ width: 60, height: 10 }} />
            <div className="ns-skeleton" style={{ width: 60, height: 10 }} />
          </div>
          <div className="ns-skeleton" style={{ width: '50%', height: 14, marginTop: 16 }} />
          <div className="ns-skeleton" style={{ width: '35%', height: 12, marginTop: 8 }} />
        </div>
      </div>
    );
  }

  if (!data?.priceTarget) return null;

  const { priceTarget, recommendation } = data;
  const low = Number(priceTarget.Low) || 0;
  const high = Number(priceTarget.High) || 0;
  const mean = Number(priceTarget.Mean) || 0;
  const median = Number(priceTarget.Median) || 0;
  const estimates = Number(priceTarget.NumberOfEstimates) || 0;
  const recMean = Number(recommendation?.Mean) || 3;

  const range = high - low;
  const meanPct = range > 0 ? ((mean - low) / range) * 100 : 50;
  const pricePct = currentPrice != null && range > 0
    ? ((currentPrice - low) / range) * 100
    : null;

  const recLabel = getRecLabel(recMean);
  const recColor = getRecColor(recMean);

  // Score dots: 5 dots representing 1-5 scale
  const dots = [1, 2, 3, 4, 5];

  return (
    <div className={`ns-card ${className || ''}`} style={{ padding: 18 }}>
      <div className="ns-card-header">
        <div className="ns-card-title"><Target size={14} /> Analyst Price Targets</div>
        <div style={{ fontSize: 10.5, color: 'var(--ns-text-4)', letterSpacing: '0.06em' }}>
          {estimates} ANALYSTS
        </div>
      </div>

      {/* Price range bar */}
      <div style={{ marginTop: 14, padding: '14px 0' }}>
        <div style={{ position: 'relative', height: 6, background: 'var(--ns-surface-hi)', borderRadius: 99 }}>
          {/* Filled range from low to high */}
          <div style={{
            position: 'absolute', height: '100%', borderRadius: 99,
            left: 0, right: 0,
            background: 'linear-gradient(90deg, var(--ns-loss), var(--ns-accent), var(--ns-profit))',
            opacity: 0.5,
          }} />
          {/* Mean marker */}
          <div style={{
            position: 'absolute', top: '50%',
            left: `${Math.max(2, Math.min(98, meanPct))}%`,
            width: 12, height: 12, borderRadius: '50%',
            background: 'var(--ns-accent)', border: '2px solid var(--ns-bg)',
            transform: 'translate(-50%, -50%)', zIndex: 2,
          }} />
          {/* Current price marker */}
          {pricePct != null && (
            <div style={{
              position: 'absolute', top: '50%',
              left: `${Math.max(2, Math.min(98, pricePct))}%`,
              width: 10, height: 10, borderRadius: 2,
              background: 'var(--ns-text)', border: '2px solid var(--ns-bg)',
              transform: 'translate(-50%, -50%) rotate(45deg)', zIndex: 3,
            }} />
          )}
        </div>

        {/* Labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--ns-text-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Low</div>
            <div className="mono tnum" style={{ fontSize: 13, fontWeight: 600, color: 'var(--ns-loss)' }}>
              {low.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--ns-text-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Mean</div>
            <div className="mono tnum" style={{ fontSize: 13, fontWeight: 600, color: 'var(--ns-accent)' }}>
              {mean.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: 'var(--ns-text-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>High</div>
            <div className="mono tnum" style={{ fontSize: 13, fontWeight: 600, color: 'var(--ns-profit)' }}>
              {high.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Current price & Median row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, padding: '8px 12px', borderRadius: 10, background: 'var(--ns-surface)', border: '1px solid var(--ns-border)' }}>
          {currentPrice != null && (
            <div>
              <div style={{ fontSize: 10, color: 'var(--ns-text-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Current</div>
              <div className="mono tnum" style={{ fontSize: 13, fontWeight: 600 }}>
                {currentPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </div>
            </div>
          )}
          <div style={{ textAlign: currentPrice != null ? 'right' : 'left' }}>
            <div style={{ fontSize: 10, color: 'var(--ns-text-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Median</div>
            <div className="mono tnum" style={{ fontSize: 13, fontWeight: 600 }}>
              {median.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 10, background: 'var(--ns-surface)', border: '1px solid var(--ns-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10.5, color: 'var(--ns-text-4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              Consensus
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: recColor, marginTop: 2, letterSpacing: '-0.01em' }}>
              {recLabel}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {dots.map(d => (
              <div
                key={d}
                style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: d <= Math.round(recMean) ? recColor : 'var(--ns-surface-hi)',
                  transition: 'background 0.3s ease',
                }}
              />
            ))}
            <span className="mono" style={{ fontSize: 11, color: 'var(--ns-text-3)', marginLeft: 6 }}>
              {recMean.toFixed(1)}/5
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalystTargets;
