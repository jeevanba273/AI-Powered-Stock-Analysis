
import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, ReferenceLine, ComposedChart, Line
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface StockDataPoint {
  date: string;
  open?: number; // Made optional to match service interfaces
  high?: number; // Made optional to match service interfaces
  low?: number;  // Made optional to match service interfaces
  close: number;
  volume?: number; // Made optional to match service interfaces
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
}

// Helper to format numbers
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
    
    // Check if open exists before calculating percentage change
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

const RSIChart = ({ data, rsiData }: { data: StockDataPoint[], rsiData: number[] }) => {
  // Combine date with RSI data
  const chartData = data.map((point, index) => ({
    date: point.date,
    rsi: rsiData[index] || null
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <ComposedChart
        data={chartData}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }} 
          tickLine={{ stroke: '#2D3748' }} 
          axisLine={{ stroke: '#2D3748' }} 
        />
        <YAxis 
          domain={[0, 100]} 
          tick={{ fontSize: 12 }} 
          tickLine={{ stroke: '#2D3748' }} 
          axisLine={{ stroke: '#2D3748' }} 
          orientation="right"
        />
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2D3748" />
        <Tooltip />
        <ReferenceLine y={70} stroke="red" strokeDasharray="3 3" />
        <ReferenceLine y={30} stroke="green" strokeDasharray="3 3" />
        <Line 
          type="monotone" 
          dataKey="rsi" 
          stroke="#ED8936" 
          strokeWidth={2} 
          dot={false} 
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

const MACDChart = ({ data, macdData }: { 
  data: StockDataPoint[], 
  macdData: { macd: number[], signal: number[], histogram: number[] } 
}) => {
  // Combine date with MACD data
  const chartData = data.map((point, index) => ({
    date: point.date,
    macd: macdData.macd[index] || null,
    signal: macdData.signal[index] || null,
    histogram: macdData.histogram[index] || null
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <ComposedChart
        data={chartData}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }} 
          tickLine={{ stroke: '#2D3748' }} 
          axisLine={{ stroke: '#2D3748' }} 
        />
        <YAxis 
          tick={{ fontSize: 12 }} 
          tickLine={{ stroke: '#2D3748' }} 
          axisLine={{ stroke: '#2D3748' }} 
          orientation="right"
        />
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2D3748" />
        <Tooltip />
        <Bar 
          dataKey="histogram" 
          fill="#9F7AEA" 
          opacity={0.8} 
        />
        <Line 
          type="monotone" 
          dataKey="macd" 
          stroke="#9F7AEA" 
          strokeWidth={2} 
          dot={false} 
        />
        <Line 
          type="monotone" 
          dataKey="signal" 
          stroke="#F687B3" 
          strokeWidth={2} 
          dot={false} 
        />
        <Legend />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

const StockChart: React.FC<StockChartProps> = ({ data, className }) => {
  // Mock data for RSI and MACD if not provided
  const rsiData = data.indicators?.rsi || Array(data.stockData.length).fill(0).map(() => Math.random() * 100);
  const macdData = data.indicators?.macd || {
    macd: Array(data.stockData.length).fill(0).map(() => Math.random() * 2 - 1),
    signal: Array(data.stockData.length).fill(0).map(() => Math.random() * 2 - 1),
    histogram: Array(data.stockData.length).fill(0).map(() => Math.random() * 2 - 1)
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex justify-between items-center">
          <span>{data.ticker} Stock Price Chart</span>
          <div className="flex gap-2">
            <span className="text-sm font-normal px-2 py-1 bg-secondary rounded-md">1D</span>
            <span className="text-sm font-normal px-2 py-1 bg-primary rounded-md">1W</span>
            <span className="text-sm font-normal px-2 py-1 bg-secondary rounded-md">1M</span>
            <span className="text-sm font-normal px-2 py-1 bg-secondary rounded-md">1Y</span>
            <span className="text-sm font-normal px-2 py-1 bg-secondary rounded-md">5Y</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="price" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="price">Price</TabsTrigger>
            <TabsTrigger value="indicators">Indicators</TabsTrigger>
          </TabsList>
          <TabsContent value="price" className="space-y-4">
            <PriceChart data={data.stockData} />
            <VolumeChart data={data.stockData} />
          </TabsContent>
          <TabsContent value="indicators" className="space-y-4">
            <PriceChart data={data.stockData} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="indicator-panel">
                <h3 className="text-sm font-medium mb-2">RSI (Relative Strength Index)</h3>
                <RSIChart data={data.stockData} rsiData={rsiData} />
              </div>
              <div className="indicator-panel">
                <h3 className="text-sm font-medium mb-2">MACD (Moving Average Convergence Divergence)</h3>
                <MACDChart data={data.stockData} macdData={macdData} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StockChart;
