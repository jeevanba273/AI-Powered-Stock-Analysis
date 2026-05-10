import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, AreaSeries, HistogramSeries, LineSeries, ColorType } from 'lightweight-charts';
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
  indicators?: { sma?: number[] };
}

interface StockChartProps {
  data: ChartData;
  className?: string;
  onTimeFrameChange?: (tf: string) => void;
  activeTimeFrame?: string;
}

const TFS = ['1W', '1M', '3M', '6M', '1Y', '3Y', '5Y', 'MAX'];

const StockChart: React.FC<StockChartProps> = ({ data, className, onTimeFrameChange, activeTimeFrame }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartApi = useRef<IChartApi | null>(null);
  const areaSeries = useRef<ISeriesApi<'Area'> | null>(null);
  const volumeSeries = useRef<ISeriesApi<'Histogram'> | null>(null);
  const sma20Series = useRef<ISeriesApi<'Line'> | null>(null);
  const sma50Series = useRef<ISeriesApi<'Line'> | null>(null);
  const [activeTf, setActiveTf] = useState(activeTimeFrame || '1M');
  const [activeInd, setActiveInd] = useState<string[]>(['SMA20']);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const el = tabsRef.current?.querySelector('.ns-chart-tab.active') as HTMLElement | null;
    if (el && tabsRef.current) {
      const r = el.getBoundingClientRect();
      const p = tabsRef.current.getBoundingClientRect();
      setPill({ left: r.left - p.left, width: r.width });
    }
  }, [activeTf]);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = createChart(chartRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#8b8fa3',
        fontFamily: "'Geist Mono', monospace",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: 'rgba(55, 60, 80, 0.3)' },
        horzLines: { color: 'rgba(55, 60, 80, 0.3)' },
      },
      crosshair: {
        vertLine: { color: 'rgba(135, 140, 160, 0.5)', style: 3, width: 1 },
        horzLine: { color: 'rgba(135, 140, 160, 0.5)', style: 3, width: 1 },
      },
      rightPriceScale: {
        borderColor: 'rgba(55, 60, 80, 0.5)',
      },
      timeScale: {
        borderColor: 'rgba(55, 60, 80, 0.5)',
        timeVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    });

    chartApi.current = chart;

    const area = chart.addSeries(AreaSeries, {
      topColor: 'rgba(10, 216, 143, 0.35)',
      bottomColor: 'rgba(10, 216, 143, 0)',
      lineColor: '#0AD88F',
      lineWidth: 2,
      crosshairMarkerRadius: 5,
      crosshairMarkerBorderColor: '#0AD88F',
      crosshairMarkerBackgroundColor: '#1e2230',
      priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
    });
    areaSeries.current = area;

    const volume = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'vol',
    });
    volumeSeries.current = volume;
    chart.priceScale('vol').applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });

    const sma20 = chart.addSeries(LineSeries, {
      color: '#5BD4E8',
      lineWidth: 1,
      lineStyle: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    sma20Series.current = sma20;

    const sma50 = chart.addSeries(LineSeries, {
      color: '#9D8CFF',
      lineWidth: 1,
      lineStyle: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    sma50Series.current = sma50;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        chart.applyOptions({ width: entry.contentRect.width });
      }
    });
    resizeObserver.observe(chartRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartApi.current = null;
    };
  }, []);

  useEffect(() => {
    if (!areaSeries.current || !volumeSeries.current) return;

    const points = data.stockData;
    if (points.length === 0) return;

    const areaData = points.map(d => ({
      time: d.date as string,
      value: d.close,
    }));
    areaSeries.current.setData(areaData as any);

    const volData = points.map((d, i) => {
      const isUp = i === 0 || d.close >= points[i - 1].close;
      return {
        time: d.date as string,
        value: d.volume || 0,
        color: isUp ? 'rgba(10, 216, 143, 0.4)' : 'rgba(255, 83, 83, 0.4)',
      };
    });
    volumeSeries.current.setData(volData as any);

    updateSMA(points);

    chartApi.current?.timeScale().fitContent();
  }, [data.stockData]);

  useEffect(() => {
    updateSMAVisibility();
  }, [activeInd]);

  const updateSMA = (points: StockDataPoint[]) => {
    const closes = points.map(d => d.close);

    const calcSMA = (n: number) => {
      const result: { time: string; value: number }[] = [];
      for (let i = n - 1; i < closes.length; i++) {
        let sum = 0;
        for (let j = i - n + 1; j <= i; j++) sum += closes[j];
        result.push({ time: points[i].date, value: sum / n });
      }
      return result;
    };

    const n20 = Math.min(20, Math.floor(closes.length / 3));
    const n50 = Math.min(50, Math.floor(closes.length / 2));

    if (sma20Series.current) sma20Series.current.setData(calcSMA(n20) as any);
    if (sma50Series.current) sma50Series.current.setData(calcSMA(n50) as any);

    updateSMAVisibility();
  };

  const updateSMAVisibility = () => {
    if (sma20Series.current) {
      sma20Series.current.applyOptions({ visible: activeInd.includes('SMA20') });
    }
    if (sma50Series.current) {
      sma50Series.current.applyOptions({ visible: activeInd.includes('SMA50') });
    }
  };

  const handleTfChange = (tf: string) => {
    setActiveTf(tf);
    onTimeFrameChange?.(tf);
  };

  const points = data.stockData;
  const up = points.length >= 2 && points[points.length - 1].close >= points[0].close;
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
            {['SMA20', 'SMA50'].map(ind => (
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

      <div ref={chartRef} style={{ width: '100%', height: 420 }} />
    </div>
  );
};

export default StockChart;
