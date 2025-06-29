
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TrendingDown, TrendingUp, Gauge, AlertCircle, Lightbulb, CheckCircle2, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AIAnalysisResponse } from '@/services/aiService';
import FutureTrendAnalysis from './FutureTrendAnalysis';
import CurrentTrendAnalysis from './CurrentTrendAnalysis';

interface AIAnalysisResultsProps {
  analysis: AIAnalysisResponse;
  stockData: any;
  className?: string;
}

const AIAnalysisResults: React.FC<AIAnalysisResultsProps> = ({ 
  analysis, 
  stockData,
  className 
}) => {
  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'Strong Buy': return 'bg-green-700';
      case 'Buy': return 'bg-green-500';
      case 'Hold': return 'bg-yellow-500';
      case 'Sell': return 'bg-red-500';
      case 'Strong Sell': return 'bg-red-700';
      default: return 'bg-secondary';
    }
  };

  const getRiskColor = (risk: number) => {
    switch (risk) {
      case 1: return 'bg-emerald-500';
      case 2: return 'bg-green-500';
      case 3: return 'bg-yellow-500';
      case 4: return 'bg-orange-500';
      case 5: return 'bg-red-500';
      default: return 'bg-secondary';
    }
  };

  const getPatternIcon = (pattern: string) => {
    if (pattern.includes('Uptrend') || 
        pattern.includes('bullish') || 
        pattern.includes('Golden Cross') || 
        pattern.includes('breakout') || 
        pattern.includes('white soldiers') ||
        pattern.includes('Increasing volume') ||
        pattern.includes('Oversold') ||
        pattern.includes('bounce') ||
        pattern.includes('Support') ||
        pattern.includes('Double Bottom')) {
      return <ArrowUp className="w-3 h-3 mr-1 text-profit flex-shrink-0" />;
    } 
    else if (pattern.includes('Downtrend') || 
             pattern.includes('bearish') || 
             pattern.includes('Death Cross') ||
             pattern.includes('breakdown') || 
             pattern.includes('black crows') ||
             pattern.includes('Decreasing volume') ||
             pattern.includes('Overbought') ||
             pattern.includes('Resistance') ||
             pattern.includes('Double Top') ||
             pattern.includes('MACD crossover') ||
             pattern.includes('Head and Shoulders')) {
      return <ArrowDown className="w-3 h-3 mr-1 text-loss flex-shrink-0" />;
    } 
    else {
      return <AlertCircle className="w-3 h-3 mr-1 text-primary flex-shrink-0" />;
    }
  };

  const isPatternBullish = (pattern: string): boolean | null => {
    if (pattern.includes('Uptrend') || 
        pattern.includes('bullish') || 
        pattern.includes('Golden Cross') || 
        pattern.includes('breakout') || 
        pattern.includes('white soldiers') ||
        pattern.includes('Increasing volume') ||
        pattern.includes('Oversold') ||
        pattern.includes('bounce') ||
        pattern.includes('Support') ||
        pattern.includes('Double Bottom')) {
      return true;
    } else if (pattern.includes('Downtrend') || 
              pattern.includes('bearish') || 
              pattern.includes('Death Cross') ||
              pattern.includes('breakdown') || 
              pattern.includes('black crows') ||
              pattern.includes('Decreasing volume') ||
              pattern.includes('Overbought') ||
              pattern.includes('Resistance') ||
              pattern.includes('Double Top') ||
              pattern.includes('MACD crossover') ||
              pattern.includes('Head and Shoulders')) {
      return false;
    }
    return null; // neutral
  };

  const getAIInsights = () => {
    if (!analysis) return [];
    
    const insights = [
      `The stock is showing ${analysis.recommendation.includes('Buy') ? 'bullish' : analysis.recommendation.includes('Sell') ? 'bearish' : 'neutral'} signals with a ${analysis.riskLevel.toLowerCase()} risk profile.`,
      `Primary technical pattern identified: ${analysis.technicalPatterns[0] || 'N/A'}.`,
      `Key support level at ₹${analysis.supportResistance.support[0]?.toLocaleString() || 'N/A'} with secondary support at ₹${analysis.supportResistance.support[1]?.toLocaleString() || 'N/A'}.`,
      `Immediate resistance detected at ₹${analysis.supportResistance.resistance[0]?.toLocaleString() || 'N/A'}.`,
      `${analysis.technicalPatterns.length > 1 ? `Additional pattern: ${analysis.technicalPatterns[1]}` : 'No additional patterns detected'}.`,
      `Final recommendation: ${analysis.recommendation} - ${
        analysis.recommendation === 'Strong Buy' ? 'Excellent opportunity for entry'
        : analysis.recommendation === 'Buy' ? 'Good potential for positive returns'
        : analysis.recommendation === 'Hold' ? 'Consider maintaining current positions'
        : analysis.recommendation === 'Sell' ? 'Consider reducing exposure'
        : 'Consider exiting positions'
      }`
    ];
    
    return insights;
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <h3 className="text-sm font-medium mb-2">Technical Analysis</h3>
        <p className="text-sm text-muted-foreground">
          {analysis.analysis} This analysis evaluates the stock's current technical positioning by examining price action, volume trends, and chart patterns in conjunction with market conditions. The analysis considers moving averages, relative strength, momentum oscillators, and pattern recognition to identify potential support/resistance levels and likely price trajectories based on historical behavior and current market dynamics.
        </p>
      </div>
      
      <Separator />
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-secondary/50 rounded-lg p-3 col-span-2 flex flex-col justify-center">
          <h3 className="text-sm font-medium flex items-center">
            <Gauge className="w-4 h-4 mr-1" />
            Risk Assessment
          </h3>
          <div className="flex items-center my-2">
            <div className="w-full bg-secondary rounded-full h-2.5">
              <div 
                className={cn("h-2.5 rounded-full", getRiskColor(analysis.risk))} 
                style={{ width: `${analysis.risk * 20}%` }}
              ></div>
            </div>
            <span className="ml-2 text-sm font-medium">{analysis.riskLevel}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Based on volatility, price action, and sector trends
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-secondary/50 p-2 rounded-lg">
          <h4 className="text-xs font-medium text-muted-foreground mb-1 flex items-center">
            <TrendingDown className="w-3 h-3 mr-1 text-loss" />
            Support Levels
          </h4>
          <div className="text-sm">
            {analysis.supportResistance.support.map((level, idx) => (
              <span key={idx} className="mr-2">₹{level.toLocaleString()}</span>
            ))}
          </div>
        </div>
        <div className="bg-secondary/50 p-2 rounded-lg">
          <h4 className="text-xs font-medium text-muted-foreground mb-1 flex items-center">
            <TrendingUp className="w-3 h-3 mr-1 text-profit" />
            Resistance Levels
          </h4>
          <div className="text-sm">
            {analysis.supportResistance.resistance.map((level, idx) => (
              <span key={idx} className="mr-2">₹{level.toLocaleString()}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-secondary/50 rounded-lg p-3">
        <h3 className="text-sm font-medium flex items-center mb-3">
          <AlertCircle className="w-4 h-4 mr-1" />
          Technical Patterns
        </h3>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {analysis.technicalPatterns.map((pattern, idx) => {
            const isBullish = isPatternBullish(pattern);
            
            return (
              <div 
                key={idx} 
                className="flex items-center p-2 rounded-md bg-background/60"
              >
                {isBullish === true ? (
                  <ArrowUp className="w-3 h-3 mr-1 text-profit flex-shrink-0" />
                ) : isBullish === false ? (
                  <ArrowDown className="w-3 h-3 mr-1 text-loss flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-3 h-3 mr-1 text-primary flex-shrink-0" />
                )}
                <span className="text-md font-medium">
                  {pattern}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center">
            <Lightbulb className="h-5 w-5 mr-2 text-primary" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {getAIInsights().map((insight, index) => (
              <div key={index} className="flex items-start gap-2">
                {index === getAIInsights().length - 1 ? (
                  <div className="flex items-start gap-2 w-full bg-secondary/50 p-2 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 text-primary flex-shrink-0" />
                    <p className="text-base font-medium">{insight}</p>
                  </div>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                    <p className="text-sm">{insight}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CurrentTrendAnalysis 
          stockData={stockData} 
          aiAnalysis={analysis}
        />
        
        <FutureTrendAnalysis 
          changePercent={stockData.changePercent} 
          aiAnalysis={analysis}
        />
      </div>
    </div>
  );
};

export default AIAnalysisResults;
