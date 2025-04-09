
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Clock, BarChart3, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AIAnalysisResponse } from '@/services/aiService';

interface CurrentTrendAnalysisProps {
  stockData: any;
  aiAnalysis: AIAnalysisResponse;
  className?: string;
}

const CurrentTrendAnalysis: React.FC<CurrentTrendAnalysisProps> = ({
  stockData,
  aiAnalysis,
  className
}) => {
  // Analyze historical data to identify trends
  const analyzeCurrentTrend = (timeframe: 'short' | 'mid' | 'long') => {
    const priceData = stockData.stockData || [];
    if (!priceData.length) return null;
    
    let dataPoints: number[] = [];
    const currentPrice = priceData[priceData.length - 1].close;
    
    // Short term: last 7 data points
    // Mid term: last 30 data points
    // Long term: last 90 data points
    const lookback = timeframe === 'short' ? 7 : timeframe === 'mid' ? 30 : 90;
    
    // Get data points for the specified timeframe
    const relevantData = priceData.slice(-Math.min(lookback, priceData.length));
    dataPoints = relevantData.map(point => point.close);
    
    if (dataPoints.length < 2) return null;
    
    // Calculate simple linear regression for trend direction
    const n = dataPoints.length;
    const indices = Array.from({length: n}, (_, i) => i);
    
    // Calculate mean of x and y
    const meanX = indices.reduce((sum, x) => sum + x, 0) / n;
    const meanY = dataPoints.reduce((sum, y) => sum + y, 0) / n;
    
    // Calculate slope
    const numerator = indices.reduce((sum, x, i) => sum + (x - meanX) * (dataPoints[i] - meanY), 0);
    const denominator = indices.reduce((sum, x) => sum + Math.pow(x - meanX, 2), 0);
    const slope = denominator !== 0 ? numerator / denominator : 0;
    
    // Calculate strength of trend (R-squared)
    const yPredicted = indices.map(x => meanY + slope * (x - meanX));
    const ssRes = dataPoints.reduce((sum, y, i) => sum + Math.pow(y - yPredicted[i], 2), 0);
    const ssTot = dataPoints.reduce((sum, y) => sum + Math.pow(y - meanY, 2), 0);
    const rSquared = ssTot !== 0 ? 1 - (ssRes / ssTot) : 0;
    
    // Calculate volatility (standard deviation / mean)
    const variance = dataPoints.reduce((sum, y) => sum + Math.pow(y - meanY, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    const volatility = meanY !== 0 ? stdDev / meanY : 0;
    
    // Calculate percentage change
    const startPrice = dataPoints[0];
    const endPrice = dataPoints[dataPoints.length - 1];
    const percentChange = ((endPrice - startPrice) / startPrice) * 100;
    
    // Determine trend direction and strength
    const isBullish = slope > 0;
    const isStrong = rSquared > 0.7;
    const isModerate = rSquared > 0.3 && rSquared <= 0.7;
    const isWeak = rSquared <= 0.3;
    const isVolatile = volatility > 0.05;
    
    return {
      direction: isBullish ? 'bullish' : 'bearish',
      strength: isStrong ? 'strong' : isModerate ? 'moderate' : 'weak',
      percentChange: percentChange.toFixed(2),
      volatility: isVolatile ? 'high' : 'low',
      slope,
      rSquared,
      dataPoints
    };
  };

  const shortTermTrend = analyzeCurrentTrend('short');
  const midTermTrend = analyzeCurrentTrend('mid');
  const longTermTrend = analyzeCurrentTrend('long');

  const renderTrendInfo = (
    trend: ReturnType<typeof analyzeCurrentTrend>,
    timeframe: string
  ) => {
    if (!trend) return (
      <div className="flex items-center px-3 py-2 bg-secondary/50 rounded-lg">
        <span className="text-muted-foreground text-sm">Insufficient data for {timeframe}</span>
      </div>
    );
    
    const isBullish = trend.direction === 'bullish';
    const percentChange = parseFloat(trend.percentChange);
    
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg",
        isBullish ? "bg-green-500/10" : "bg-red-500/10"
      )}>
        {isBullish ? (
          <TrendingUp className="h-4 w-4 text-profit" />
        ) : (
          <TrendingDown className="h-4 w-4 text-loss" />
        )}
        
        <div className="flex-1">
          <div className={cn(
            "font-medium text-sm",
            isBullish ? "text-profit" : "text-loss"
          )}>
            {trend.strength.charAt(0).toUpperCase() + trend.strength.slice(1)} {trend.direction}
          </div>
          <div className="text-xs text-muted-foreground">
            {percentChange > 0 ? "+" : ""}{trend.percentChange}% change with {trend.volatility} volatility
          </div>
        </div>
        
        <Badge variant="outline" className="ml-auto text-xs">
          {timeframe}
        </Badge>
      </div>
    );
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center">
          <Activity className="h-5 w-5 mr-2 text-primary" />
          Current Trend Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {renderTrendInfo(shortTermTrend, "Short-term (1W)")}
          {renderTrendInfo(midTermTrend, "Mid-term (1M)")}
          {renderTrendInfo(longTermTrend, "Long-term (3M)")}
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrentTrendAnalysis;
