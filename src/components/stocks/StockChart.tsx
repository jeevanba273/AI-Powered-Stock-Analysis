import React, { useMemo, useState, useRef, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';

interface StockDataPoint {
  date: string;
  open?: number;
  high?: number;
  low?: number;
  close: number;
  volume?: number;
}

interface ChartData {
  stockData: StockDataPoint[];
  ticker: string;
  indicators?: {
    sma?: number[];
  };
}

interface StockChartProps {
  data: ChartData;
  className?: string;
  onTimeFrameChange?: (timeFrame: string) => void;
  activeTimeFrame?: string;
}

const W = 1100, H = 340, padL = 56, padR = 16, padT = 16, padB = 32;
const VH = 72;

const formatNum = (n: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n);
const formatVol = (v: number) => {
  if (v >= 1e9) return (v / 1e9).toFixed(2) + 'B';
  if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(2) + 'K';
  return v.toString();
};

const StockChart: React.FC<StockChartProps> = ({ data, className, onTimeFrameChange, activeTimeFrame }) => {
  const [hover, setHover] = useState<{ i: number; x: number; y: number } | null>(null);
  const [activeTf, setActiveTf] = useState(activeTimeFrame || '1M');
  const [activeInd, setActiveInd] = useState<string[]>(['SMA20']);
  const wrapRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState({ left: 0, width: 0 });

  const TFS = ['1W', '1M', '3M', '6M', '1Y'];
  const INDS = ['SMA20', 'SMA50'];

  useEffect(() => {
    const el = tabsRef.current?.querySelector('.ns-chart-tab.active') as HTMLElement | null;
    if (el && tabsRef.current) {
      const r = el.getBoundingClientRect();
      const p = tabsRef.current.getBoundingClientRect();
      setPill({ left: r.left - p.left, width: r.width });
    }
  }, [activeTf]);

  const points = data.stockData;
  const closes = useMemo(() => points.map(d => d.close), [points]);
  const min = useMemo(() => Math.min(...closes) * 0.998, [closes]);
  const max = useMemo(() => Math.max(...closes) * 1.002, [closes]);

  const xOf = (i: number) => padL + (i / Math.max(1, points.length - 1)) * (W - padL - padR);
  const yOf = (v: number) => padT + (1 - (v - min) / (max - min || 1)) * (H - padT - padB);

  const pathLine = useMemo(() => points.map((d, i) => `${i === 0 ? 'M' : 'L'}${xOf(i)} ${yOf(d.close)}`).join(' '), [points, min, max]);
  const pathFill = useMemo(() => pathLine + ` L${xOf(points.length - 1)} ${H - padB} L${xOf(0)} ${H - padB} Z`, [pathLine, points]);

  const sma = (n: number) => {
    const out: (number | null)[] = [];
    for (let i = 0; i < closes.length; i++) {
      if (i < n - 1) { out.push(null); continue; }
      let s = 0;
      for (let j = i - n + 1; j <= i; j++) s += closes[j];
      out.push(s / n);
    }
    return out;
  };

  const sma20 = useMemo(() => sma(Math.min(20, Math.floor(closes.length / 3))), [closes]);
  const sma50 = useMemo(() => sma(Math.min(50, Math.floor(closes.length / 2))), [closes]);

  const smaPath = (s: (number | null)[]) => s.map((v, i) => v == null ? '' : `${s[i - 1] == null ? 'M' : 'L'}${xOf(i)} ${yOf(v)}`).join(' ').trim();

  const up = points.length >= 2 && points[points.length - 1].close >= points[0].close;
  const lineColor = up ? 'oklch(0.78 0.17 155)' : 'oklch(0.7 0.22 22)';

  const ticks = [0, 0.25, 0.5, 0.75, 1].map(k => min + k * (max - min));

  const maxVol = useMemo(() => Math.max(...points.map(d => d.volume || 0), 1), [points]);
  const barW = (W - padL - padR) / Math.max(1, points.length) * 0.7;

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.max(0, Math.min(points.length - 1, Math.round(((x - padL) / (W - padL - padR)) * (points.length - 1))));
    setHover({ i, x: xOf(i), y: yOf(points[i].close) });
  };

  const handleTfChange = (tf: string) => {
    setActiveTf(tf);
    onTimeFrameChange?.(tf);
  };

  const changePct = points.length >= 2
    ? ((points[points.length - 1].close / points[0].close) - 1) * 100
    : 0;

  return (
    <div className={`ns-card ${className || ''}`} style={{ padding: 22 }}>
      <div className="ns-chart-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="ns-card-title" style={{ marginBottom: 0 }}><TrendingUp size={14} /> Price Chart</div>
          <div style={{ fontSize: 11, color: 'var(--ns-text-3)' }}>
            <span className="mono" style={{ color: up ? 'var(--ns-profit)' : 'var(--ns-loss)' }}>
              {up ? '▲' : '▼'} {Math.abs(changePct).toFixed(2)}%
            </span>
            <span style={{ color: 'var(--ns-text-4)' }}> over {activeTf}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ display: 'flex', gap: 6, padding: 3, background: 'var(--ns-surface)', border: '1px solid var(--ns-border)', borderRadius: 10 }}>
            {INDS.map(ind => (
              <div
                key={ind}
                onClick={() => setActiveInd(a => a.includes(ind) ? a.filter(x => x !== ind) : [...a, ind])}
                style={{
                  padding: '5px 10px', borderRadius: 7, fontSize: 10.5, fontWeight: 600,
                  cursor: 'pointer', letterSpacing: '0.04em', fontFamily: "'Geist Mono', monospace",
                  color: activeInd.includes(ind) ? 'var(--ns-accent)' : 'var(--ns-text-3)',
                  background: activeInd.includes(ind) ? 'var(--ns-accent-soft)' : 'transparent',
                  transition: 'all 0.15s ease'
                }}
              >{ind}</div>
            ))}
          </div>
          <div className="ns-chart-tabs" ref={tabsRef}>
            <div className="ns-chart-tab-pill" style={{ left: pill.left, width: pill.width }} />
            {TFS.map(tf => (
              <div
                key={tf}
                className={`ns-chart-tab ${activeTf === tf ? 'active' : ''}`}
                onClick={() => handleTfChange(tf)}
              >{tf}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="chart-wrap" ref={wrapRef} style={{ position: 'relative' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          style={{ width: '100%', height: H, display: 'block' }}
          onMouseMove={handleMove}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id="ns-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity="0.35" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
            </linearGradient>
            <linearGradient id="ns-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={lineColor} />
              <stop offset="100%" stopColor="oklch(0.82 0.13 195)" />
            </linearGradient>
          </defs>

          {/* Y grid */}
          {ticks.map((v, i) => (
            <g key={i}>
              <line x1={padL} y1={yOf(v)} x2={W - padR} y2={yOf(v)} stroke="oklch(0.32 0.014 240 / 0.4)" strokeDasharray="2 4" strokeWidth="1" />
              <text x={padL - 8} y={yOf(v) + 3} fill="oklch(0.55 0.012 240)" fontSize="10" fontFamily="Geist Mono" textAnchor="end">{v.toFixed(0)}</text>
            </g>
          ))}

          {/* Area fill */}
          <path d={pathFill} fill="url(#ns-area)" style={{ animation: 'ns-area-in 0.9s ease forwards', opacity: 0 }} />

          {/* Price line */}
          <path
            d={pathLine}
            fill="none" stroke="url(#ns-line)" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ strokeDasharray: 4000, strokeDashoffset: 4000, animation: 'ns-draw 1.4s cubic-bezier(0.2,0.6,0.2,1) forwards' }}
          />

          {/* SMAs */}
          {activeInd.includes('SMA20') && (
            <path d={smaPath(sma20)} fill="none" stroke="oklch(0.82 0.13 195)" strokeWidth="1.4" strokeDasharray="4 3" opacity="0.85" />
          )}
          {activeInd.includes('SMA50') && (
            <path d={smaPath(sma50)} fill="none" stroke="oklch(0.72 0.16 270)" strokeWidth="1.4" strokeDasharray="6 4" opacity="0.85" />
          )}

          {/* Hover crosshair */}
          {hover && (
            <g>
              <line x1={hover.x} y1={padT} x2={hover.x} y2={H - padB} stroke="oklch(0.6 0.012 240 / 0.5)" strokeDasharray="3 3" strokeWidth="1" />
              <line x1={padL} y1={hover.y} x2={W - padR} y2={hover.y} stroke="oklch(0.6 0.012 240 / 0.5)" strokeDasharray="3 3" strokeWidth="1" />
              <circle cx={hover.x} cy={hover.y} r="6" fill="var(--ns-bg-2)" stroke={lineColor} strokeWidth="2" />
              <circle cx={hover.x} cy={hover.y} r="3" fill={lineColor} />
            </g>
          )}
        </svg>

        {/* Tooltip */}
        {hover && (() => {
          const d = points[hover.i];
          const rect = wrapRef.current?.getBoundingClientRect();
          const px = (hover.x / W) * (rect?.width || 1);
          const py = (hover.y / H) * (rect?.height || 1);
          return (
            <div className="ns-chart-tooltip" style={{ left: px, top: py, opacity: 1 }}>
              <div style={{ fontSize: 10.5, color: 'var(--ns-text-3)', marginBottom: 4 }} className="mono">{d.date}</div>
              <div className="ns-tooltip-row"><span className="ns-tooltip-lbl">Close</span><span className="ns-tooltip-val mono tnum">₹{formatNum(d.close)}</span></div>
              {d.open != null && <div className="ns-tooltip-row"><span className="ns-tooltip-lbl">Open</span><span className="ns-tooltip-val mono tnum">₹{formatNum(d.open)}</span></div>}
              {d.high != null && <div className="ns-tooltip-row"><span className="ns-tooltip-lbl">High</span><span className="ns-tooltip-val mono tnum" style={{ color: 'var(--ns-profit)' }}>₹{formatNum(d.high)}</span></div>}
              {d.low != null && <div className="ns-tooltip-row"><span className="ns-tooltip-lbl">Low</span><span className="ns-tooltip-val mono tnum" style={{ color: 'var(--ns-loss)' }}>₹{formatNum(d.low)}</span></div>}
              {d.volume != null && (
                <>
                  <div style={{ height: 1, background: 'var(--ns-border)', margin: '4px 0' }} />
                  <div className="ns-tooltip-row"><span className="ns-tooltip-lbl">Vol</span><span className="ns-tooltip-val mono tnum">{formatVol(d.volume)}</span></div>
                </>
              )}
            </div>
          );
        })()}

        {/* Volume bars */}
        <svg viewBox={`0 0 ${W} ${VH}`} preserveAspectRatio="none" style={{ width: '100%', height: VH, display: 'block', marginTop: 6 }}>
          <text x={padL - 8} y={VH - 8} fill="oklch(0.5 0.012 240)" fontSize="10" fontFamily="Geist Mono" textAnchor="end">VOL</text>
          {points.map((d, i) => {
            const vol = d.volume || 0;
            const h = (vol / maxVol) * (VH - 16);
            const isUp = i === 0 || d.close >= points[i - 1].close;
            return (
              <rect
                key={i}
                x={xOf(i) - barW / 2}
                y={VH - 4 - h}
                width={Math.max(1, barW)}
                height={h}
                fill={isUp ? 'oklch(0.78 0.17 155 / 0.45)' : 'oklch(0.7 0.22 22 / 0.45)'}
                rx="1"
                style={{ animation: `ns-bar-rise 0.6s ${i * 0.003}s cubic-bezier(0.2,0.9,0.3,1.1) backwards` }}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default StockChart;
