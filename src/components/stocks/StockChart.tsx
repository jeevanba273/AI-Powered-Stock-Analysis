
import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
    rsi?: number[];
    macd?: { macd: number[]; signal: number[]; histogram: number[] };
  };
}

interface StockChartProps {
  data: ChartData;
  className?: string;
  onTimeFrameChange?: (timeFrame: string) => void;
  activeTimeFrame?: string;
}

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US', { 
    style: 'decimal',
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }).format(num);
};

const formatVolume = (volume: number): string => {
  if (volume >= 1000000000) {
    return `${(volume / 1000000000).toFixed(2)}B`;
  } else if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(2)}M`;
  } else if (volume >= 1000) {
    return `${(volume / 1000).toFixed(2)}K`;
  }
  return volume.toString();
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    const changePercent = data.open 
      ? ((data.close - data.open) / data.open * 100).toFixed(2)
      : '0.00';
    const isPositive = data.open ? data.close >= data.open : true;
    
    return (
      <div className="bg-popover p-3 rounded-md border border-border shadow-lg">
        <p className="font-medium text-sm mb-2">{label}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          {data.open !== undefined && (
            <>
              <p>Open:</p>
              <p className="text-right">{formatNumber(data.open)}</p>
            </>
          )}
          {data.high !== undefined && (
            <>
              <p>High:</p>
              <p className="text-right">{formatNumber(data.high)}</p>
            </>
          )}
          {data.low !== undefined && (
            <>
              <p>Low:</p>
              <p className="text-right">{formatNumber(data.low)}</p>
            </>
          )}
          <p>Close:</p>
          <p className="text-right">{formatNumber(data.close)}</p>
          {data.volume !== undefined && (
            <>
              <p>Volume:</p>
              <p className="text-right">{formatVolume(data.volume)}</p>
            </>
          )}
          {data.open !== undefined && (
            <>
              <p>Change:</p>
              <p className={cn(
                "text-right",
                isPositive ? "text-profit" : "text-loss"
              )}>
                {isPositive ? "+" : ""}{changePercent}%
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
};

const PriceChart = ({ data }: { data: StockDataPoint[] }) => {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4299E1" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#4299E1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }} 
          tickLine={{ stroke: '#2D3748' }} 
          axisLine={{ stroke: '#2D3748' }} 
        />
        <YAxis 
          domain={['auto', 'auto']} 
          tick={{ fontSize: 12 }} 
          tickLine={{ stroke: '#2D3748' }} 
          axisLine={{ stroke: '#2D3748' }} 
          orientation="right"
        />
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2D3748" />
        <Tooltip content={<CustomTooltip />} />
        <Area 
          type="monotone" 
          dataKey="close" 
          stroke="#4299E1" 
          fillOpacity={1} 
          fill="url(#colorClose)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

const VolumeChart = ({ data }: { data: StockDataPoint[] }) => {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }} 
          tickLine={{ stroke: '#2D3748' }} 
          axisLine={{ stroke: '#2D3748' }} 
        />
        <YAxis 
          tickFormatter={formatVolume} 
          tick={{ fontSize: 12 }} 
          tickLine={{ stroke: '#2D3748' }} 
          axisLine={{ stroke: '#2D3748' }} 
          orientation="right"
        />
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2D3748" />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="volume" fill="#4FD1C5" opacity={0.8} />
      </BarChart>
    </ResponsiveContainer>
  );
};

const StockChart: React.FC<StockChartProps> = ({ 
  data, 
  className
}) => {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">
          {data.ticker} Stock Price Chart
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <PriceChart data={data.stockData} />
          <VolumeChart data={data.stockData} />
        </div>
      </CardContent>
    </Card>
  );
};

export default StockChart;
