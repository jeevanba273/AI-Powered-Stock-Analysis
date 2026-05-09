import React, { useState, useEffect } from 'react';
import { CircleDashed, Zap, ArrowUp, ArrowDown, AlertCircle, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { AIAnalysisResponse } from '@/services/aiService';

interface StockAnalysisProps {
  ticker: string;
  stockData: any;
  onRequestAnalysis: () => Promise<AIAnalysisResponse | undefined>;
  className?: string;
}

const getRecColor = (rec: string) => {
  if (rec.includes('Buy')) return 'var(--ns-profit)';
  if (rec.includes('Sell')) return 'var(--ns-loss)';
  return 'var(--ns-text-2)';
};

const getRecBg = (rec: string) => {
  if (rec.includes('Buy')) return 'oklch(0.78 0.17 155 / 0.08)';
  if (rec.includes('Sell')) return 'oklch(0.7 0.22 22 / 0.08)';
  return 'var(--ns-surface)';
};

const getRecBorder = (rec: string) => {
  if (rec.includes('Buy')) return 'oklch(0.78 0.17 155 / 0.25)';
  if (rec.includes('Sell')) return 'oklch(0.7 0.22 22 / 0.25)';
  return 'var(--ns-border)';
};

const getPatternSide = (pattern: string): 'bullish' | 'bearish' | 'neutral' => {
  const bullish = ['Uptrend', 'bullish', 'Golden Cross', 'breakout', 'white soldiers',
    'Increasing volume', 'Oversold', 'bounce', 'Double Bottom'];
  const bearish = ['Downtrend', 'bearish', 'Death Cross', 'breakdown', 'black crows',
    'Decreasing volume', 'Overbought', 'Double Top', 'Head and Shoulders'];
  if (bullish.some(k => pattern.includes(k))) return 'bullish';
  if (bearish.some(k => pattern.includes(k))) return 'bearish';
  return 'neutral';
};

const getPatternIcon = (side: string) => {
  if (side === 'bullish') return '▲';
  if (side === 'bearish') return '▼';
  return '◐';
};

const ConfRing: React.FC<{ value: number }> = ({ value }) => {
  const r = 22, c = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: 52, height: 52 }}>
      <svg width="52" height="52" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r={r} fill="none" stroke="var(--ns-surface-hi)" strokeWidth="4" />
        <circle
          cx="26" cy="26" r={r} fill="none"
          stroke="var(--ns-profit)"
          strokeWidth="4" strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (value / 100) * c}
          transform="rotate(-90 26 26)"
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.2,0.9,0.3,1)' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 600 }} className="mono">
        {value}
      </div>
    </div>
  );
};

const StockAnalysis: React.FC<StockAnalysisProps> = ({ ticker, stockData, onRequestAnalysis, className }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentTicker, setCurrentTicker] = useState(ticker);

  useEffect(() => {
    if (currentTicker !== ticker) {
      setCurrentTicker(ticker);
      setAnalysis(null);
      setError(null);
    }
  }, [ticker, currentTicker]);

  useEffect(() => {
    if (analysis) {
      window.dispatchEvent(new CustomEvent('aiAnalysisUpdated', { detail: { analysis } }));
    }
  }, [analysis]);

  const handleGenerate = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    toast.loading("AI is analyzing stock data...", { id: "ai-analysis" });

    try {
      const result = await onRequestAnalysis();
      if (result) {
        setAnalysis(result);
        toast.success("Analysis completed successfully", { id: "ai-analysis" });
      } else {
        setError("Failed to generate analysis");
        toast.error("Failed to generate analysis", { id: "ai-analysis" });
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate analysis");
      toast.error(`Analysis error: ${err.message}`, { id: "ai-analysis" });
    } finally {
      setIsLoading(false);
    }
  };

  const riskScore = analysis?.risk || 0;
  const confidence = Math.round(Math.max(0, 100 - riskScore * 12));

  return (
    <div className={`ns-card ns-ai-card ${className || ''}`} style={{ padding: 22 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
        <div className="ns-ai-orb" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>AI Analyst</div>
          <div style={{ fontSize: 11.5, color: 'var(--ns-text-3)' }}>Technical + fundamental synthesis</div>
        </div>
        <button className="ns-ai-cta" onClick={handleGenerate} disabled={isLoading}>
          {isLoading ? (
            <><CircleDashed size={14} className="animate-spin" /> Analyzing...</>
          ) : (
            <><Zap size={14} /> {analysis ? 'Regenerate' : 'Generate Analysis'}</>
          )}
        </button>
      </div>

      {/* Body */}
      <div style={{ position: 'relative', zIndex: 1, marginTop: 18 }}>
        {/* Recommendation */}
        <div className="ns-recommendation" style={analysis ? { background: getRecBg(analysis.recommendation), borderColor: getRecBorder(analysis.recommendation) } : {}}>
          <div>
            <div className="label">Recommendation</div>
            <div className="verdict" style={analysis ? { color: getRecColor(analysis.recommendation) } : { color: 'var(--ns-text-3)' }}>
              {analysis ? analysis.recommendation : isLoading ? 'Analyzing...' : '— · —'}
            </div>
            {analysis && (
              <div style={{ fontSize: 11.5, color: 'var(--ns-text-3)', marginTop: 4 }}>
                Risk <span style={{ color: 'var(--ns-accent)' }} className="mono">{analysis.risk}/5 {analysis.riskLevel}</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, fontSize: 11, color: 'var(--ns-text-3)' }}>
            <ConfRing value={analysis ? confidence : 0} />
            <span style={{ fontSize: 10.5 }}>Confidence</span>
          </div>
        </div>

        {/* Patterns */}
        {analysis && (
          <div className="ns-patterns-grid">
            {analysis.technicalPatterns.slice(0, 4).map((pattern, i) => {
              const side = getPatternSide(pattern);
              return (
                <div key={i} className={`ns-pattern ${side}`} style={{ animation: `ns-fade-up 0.5s ${0.05 * i}s backwards` }}>
                  <div className="ns-pattern-icon mono">{getPatternIcon(side)}</div>
                  <div>
                    <div className="ns-pattern-name">{pattern}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Support & Resistance */}
        {analysis && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--ns-surface)', border: '1px solid var(--ns-border)' }}>
              <div style={{ fontSize: 10.5, color: 'var(--ns-text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ArrowDown size={12} style={{ color: 'var(--ns-profit)' }} /> Support
              </div>
              {analysis.supportResistance.support.map((level, i) => (
                <div key={i} className="mono tnum" style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>₹{level.toLocaleString()}</div>
              ))}
            </div>
            <div style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--ns-surface)', border: '1px solid var(--ns-border)' }}>
              <div style={{ fontSize: 10.5, color: 'var(--ns-text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ArrowUp size={12} style={{ color: 'var(--ns-loss)' }} /> Resistance
              </div>
              {analysis.supportResistance.resistance.map((level, i) => (
                <div key={i} className="mono tnum" style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>₹{level.toLocaleString()}</div>
              ))}
            </div>
          </div>
        )}

        {/* Analysis Stream */}
        <div className="ns-ai-stream">
          {error ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 8 }}>
              <AlertCircle size={20} style={{ color: 'var(--ns-loss)' }} />
              <p style={{ color: 'var(--ns-loss)', fontSize: 12.5 }}>{error}</p>
              <button className="ns-ai-cta" style={{ fontSize: 11 }} onClick={() => { setError(null); handleGenerate(); }}>
                <RefreshCcw size={12} /> Try Again
              </button>
            </div>
          ) : isLoading ? (
            <>
              <div style={{ fontSize: 11.5, color: 'var(--ns-accent)', letterSpacing: '0.04em', marginBottom: 10 }}>
                ▸ Local indicators · ▸ Pattern detection · ▸ Risk model
              </div>
              <div className="ns-skeleton" style={{ width: '95%' }} />
              <div className="ns-skeleton" style={{ width: '85%' }} />
              <div className="ns-skeleton" style={{ width: '92%' }} />
              <div className="ns-skeleton" style={{ width: '60%' }} />
            </>
          ) : analysis ? (
            <div style={{ whiteSpace: 'pre-wrap' }}>{analysis.analysis}</div>
          ) : (
            <div style={{ color: 'var(--ns-text-3)', fontSize: 12.5, lineHeight: 1.6 }}>
              Click <span style={{ color: 'var(--ns-accent)' }}>Generate Analysis</span> to run the analysis pipeline:
              local algorithms (RSI / MACD / Bollinger / pattern detection) plus optional AI synthesis.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockAnalysis;
