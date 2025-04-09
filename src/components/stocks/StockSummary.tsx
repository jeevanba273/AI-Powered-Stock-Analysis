
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface StockSummaryProps {
  ticker: string;
  companyName: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  marketStatus: 'open' | 'closed' | 'pre-market' | 'after-hours';
  lastUpdated: string;
  stats: {
    open: number;
    high: number;
    low: number;
    volume: number;
    avgVolume?: number; // Optional to match service interface
    marketCap: string;
    pe: number;
    dividend: string;
  };
  className?: string;
}

const StockSummary: React.FC<StockSummaryProps> = ({
  ticker,
  companyName,
  price,
  change,
  changePercent,
  currency,
  marketStatus,
  lastUpdated,
  stats,
  className,
}) => {
  const isPositive = change >= 0;
  
  const getMarketStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-500';
      case 'closed': return 'bg-red-500';
      case 'pre-market': return 'bg-yellow-500';
      case 'after-hours': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };
  
  const formatMarketStatus = (status: string) => {
    switch (status) {
      case 'open': return 'Market Open';
      case 'closed': return 'Market Closed';
      case 'pre-market': return 'Pre-Market';
      case 'after-hours': return 'After Hours';
      default: return status;
    }
  };

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold">{ticker}</h2>
            <p className="text-sm text-muted-foreground">{companyName}</p>
          </div>
          <div className="flex items-center text-xs">
            <span className={cn(
              "h-2 w-2 rounded-full mr-1",
              getMarketStatusColor(marketStatus)
            )}></span>
            <span className="mr-2">{formatMarketStatus(marketStatus)}</span>
            <Clock className="h-3 w-3 mr-1" />
            <span>{lastUpdated}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-baseline">
            <span className="text-2xl font-bold mr-2">{price.toFixed(2)}</span>
            <span className="text-sm text-muted-foreground">{currency}</span>
          </div>
          <div className={cn(
            "flex items-center text-sm",
            isPositive ? "text-profit" : "text-loss"
          )}>
            {isPositive ? (
              <ArrowUpRight className="h-4 w-4 mr-1" />
            ) : (
              <ArrowDownRight className="h-4 w-4 mr-1" />
            )}
            <span>{isPositive ? '+' : ''}{change.toFixed(2)}</span>
            <span className="mx-1">|</span>
            <span>{isPositive ? '+' : ''}{changePercent.toFixed(2)}%</span>
          </div>
        </div>
        
        <Separator />
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-xs text-muted-foreground mb-1">Open</h3>
            <p className="text-sm font-medium">{stats.open.toFixed(2)}</p>
          </div>
          <div>
            <h3 className="text-xs text-muted-foreground mb-1">Market Cap</h3>
            <p className="text-sm font-medium">{stats.marketCap}</p>
          </div>
          <div>
            <h3 className="text-xs text-muted-foreground mb-1">Day Range</h3>
            <p className="text-sm font-medium">{stats.low.toFixed(2)} - {stats.high.toFixed(2)}</p>
          </div>
          <div>
            <h3 className="text-xs text-muted-foreground mb-1">P/E Ratio</h3>
            <p className="text-sm font-medium">{stats.pe.toFixed(2)}</p>
          </div>
          <div>
            <h3 className="text-xs text-muted-foreground mb-1">Volume</h3>
            <p className="text-sm font-medium">{stats.volume.toLocaleString()}</p>
          </div>
          <div>
            <h3 className="text-xs text-muted-foreground mb-1">Dividend</h3>
            <p className="text-sm font-medium">{stats.dividend}</p>
          </div>
        </div>
        
        <div className="mt-4">
          <a 
            href="#" 
            className="text-xs flex items-center text-primary hover:text-primary/80 transition-colors"
          >
            <span>View detailed financials</span>
            <ChevronRight className="h-3 w-3 ml-1" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockSummary;
