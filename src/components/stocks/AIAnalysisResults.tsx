
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TrendingDown, TrendingUp, Gauge, AlertCircle, Layers, Lightbulb, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AIAnalysisResponse } from '@/services/aiService';
import FutureTrendAnalysis from './FutureTrendAnalysis';

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
          {analysis.analysis} This analysis indicates the stock's current momentum and potential future direction based on chart patterns, price action, and technical indicators including relative strength, volume trends, and moving average crossovers. The technical outlook considers recent market developments and sector-specific trends to provide a comprehensive evaluation of the stock's position within its current trading range.
        </p>
      </div>
      
      <Separator />
      
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-secondary/50 rounded-lg p-3 col-span-3 flex flex-col">
          <h3 className="text-sm font-medium flex items-center mb-2">
            <Gauge className="w-4 h-4 mr-1" />
            Risk Assessment
          </h3>
          <div className="flex items-center my-auto">
            <div className="w-full bg-secondary rounded-full h-2.5">
              <div 
                className={cn("h-2.5 rounded-full", getRiskColor(analysis.risk))} 
                style={{ width: `${analysis.risk * 20}%` }}
              ></div>
            </div>
            <span className="ml-2 text-sm">{analysis.riskLevel}</span>
          </div>
        </div>

        <div className="bg-secondary/50 rounded-lg p-3 col-span-2">
          <h3 className="text-sm font-medium flex items-center mb-2">
            <AlertCircle className="w-4 h-4 mr-1" />
            Patterns
          </h3>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {analysis.technicalPatterns.map((pattern, idx) => (
              <div key={idx} className="flex items-center text-sm">
                <AlertCircle className="w-3 h-3 mr-1 text-primary flex-shrink-0" />
                <span className="text-base font-medium">{pattern}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Support & Resistance</h3>
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
                    {index % 2 === 0 ? (
                      <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                    )}
                    <p className="text-sm">{insight}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <div className="md:hidden">
        <FutureTrendAnalysis 
          changePercent={stockData.changePercent} 
          aiAnalysis={analysis}
        />
      </div>
    </div>
  );
};

export default AIAnalysisResults;
