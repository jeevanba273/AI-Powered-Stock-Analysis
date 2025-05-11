import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, Clock, ChevronRight, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

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
    [key: string]: any; // Allow additional stats
  };
  className?: string;
  stockDetails?: any; // Raw stock details from API
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
  stockDetails,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
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

  // Function to format date and time
  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const formattedDate = date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      
      const formattedTime = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      
      return (
        <>
          <span>{formattedDate}</span>
          <span className="mx-2">|</span>
          <span>{formattedTime}</span>
        </>
      );
    } catch (error) {
      console.error('Date formatting error:', error);
      return dateString; // Return original string if formatting fails
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
            {formatDateTime(lastUpdated)}
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
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full text-lg font-semibold"
              >
                View Detailed Financials
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{ticker} - Detailed Financials</DialogTitle>
              </DialogHeader>
              
              <Tabs defaultValue="summary" className="w-full">
                <TabsList className="grid grid-cols-4 mb-4">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="fundamentals">Fundamentals</TabsTrigger>
                  <TabsTrigger value="financials">Financials</TabsTrigger>
                  <TabsTrigger value="stats">Advanced Stats</TabsTrigger>
                </TabsList>
                
                <TabsContent value="summary" className="space-y-4">
                  <div className="bg-card border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Company Overview</h3>
                    <p className="text-sm text-muted-foreground">
                      {stockDetails?.company_summary || `No summary available for ${companyName}.`}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-card border rounded-lg p-4">
                      <h3 className="font-semibold mb-2">Industry</h3>
                      <p className="text-sm">{stockDetails?.industry || "Technology"}</p>
                    </div>
                    <div className="bg-card border rounded-lg p-4">
                      <h3 className="font-semibold mb-2">Stock Type</h3>
                      <p className="text-sm">{stockDetails?.stats?.cappedType || "Large Cap"}</p>
                    </div>
                  </div>
                  
                  <div className="bg-card border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">52-Week Range</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-xs text-muted-foreground">NSE</h4>
                        <p className="text-sm">₹{stockDetails?.price_data?.nse?.yearLowPrice || "-"} - ₹{stockDetails?.price_data?.nse?.yearHighPrice || "-"}</p>
                      </div>
                      <div>
                        <h4 className="text-xs text-muted-foreground">BSE</h4>
                        <p className="text-sm">₹{stockDetails?.price_data?.bse?.yearLowPrice || "-"} - ₹{stockDetails?.price_data?.bse?.yearHighPrice || "-"}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="fundamentals" className="space-y-4">
                  <div className="bg-card border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Key Fundamentals</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {stockDetails?.fundamentals?.map((item: any, index: number) => (
                        <div key={index} className="border-b pb-2">
                          <h4 className="text-xs text-muted-foreground">{item.name}</h4>
                          <p className="text-sm font-medium">{item.value}</p>
                        </div>
                      )) || (
                        <p className="text-sm text-muted-foreground">No fundamental data available.</p>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="financials" className="space-y-4">
                  {stockDetails?.financials?.map((item: any, index: number) => (
                    <div key={index} className="bg-card border rounded-lg p-4">
                      <h3 className="font-semibold mb-2">{item.title}</h3>
                      
                      {item.yearly && (
                        <div className="mb-4">
                          <h4 className="text-xs text-muted-foreground mb-1">Yearly (in ₹ Cr)</h4>
                          <div className="grid grid-cols-5 gap-2">
                            {Object.entries(item.yearly).map(([year, value]: [string, any]) => (
                              <div key={year} className="text-center border-r last:border-r-0">
                                <p className="text-xs font-medium">{year}</p>
                                <p className="text-sm">{value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {item.quarterly && (
                        <div>
                          <h4 className="text-xs text-muted-foreground mb-1">Quarterly (in ₹ Cr)</h4>
                          <div className="grid grid-cols-5 gap-2">
                            {Object.entries(item.quarterly).map(([quarter, value]: [string, any]) => (
                              <div key={quarter} className="text-center border-r last:border-r-0">
                                <p className="text-xs font-medium">{quarter}</p>
                                <p className="text-sm">{value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )) || (
                    <p className="text-sm text-muted-foreground">No financial data available.</p>
                  )}
                </TabsContent>
                
                <TabsContent value="stats" className="space-y-4">
                  <div className="bg-card border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Advanced Statistics</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {stockDetails?.stats && Object.entries(stockDetails.stats)
                        .filter(([key]) => typeof stockDetails.stats[key] !== 'object')
                        .map(([key, value]: [string, any]) => (
                          <div key={key} className="border-b pb-2">
                            <h4 className="text-xs text-muted-foreground capitalize">
                              {key.replace(/([A-Z])/g, ' $1')
                                .replace(/^./, str => str.toUpperCase())
                                .replace(/Ttm/i, 'TTM')
                                .replace(/Roe/i, 'ROE')
                                .replace(/Roic/i, 'ROIC')
                                .replace(/Vs/i, 'vs')
                                .replace(/Pe/i, 'P/E')
                                .replace(/Pb/i, 'P/B')
                                .replace(/Ev/i, 'EV')
                                .replace(/Ocf/i, 'OCF')
                                .replace(/Fcf/i, 'FCF')}
                            </h4>
                            <p className="text-sm font-medium">
                              {typeof value === 'number' ? 
                                (key.toLowerCase().includes('percent') || 
                                 key.toLowerCase().includes('yield') || 
                                 key.toLowerCase().includes('ratio') ? 
                                  value.toFixed(2) : 
                                  value.toLocaleString('en-IN', {maximumFractionDigits: 2})) : 
                                String(value)}
                              {(key.toLowerCase().includes('percent') || 
                                key.toLowerCase().includes('yield') || 
                                key.toLowerCase().includes('roe') ||
                                key.toLowerCase().includes('roce') ||
                                key.toLowerCase().includes('margin')) && 
                                !String(value).includes('%') ? '%' : ''}
                            </p>
                          </div>
                        )) || (
                        <p className="text-sm text-muted-foreground">No advanced statistics available.</p>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockSummary;
