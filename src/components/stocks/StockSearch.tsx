
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchIcon, TrendingUp, X } from 'lucide-react';
import { toast } from 'sonner';
import { popularIndianStocks } from '@/services/indianStockService';

interface StockSearchProps {
  onSearchStock: (ticker: string) => void;
}

const StockSearch: React.FC<StockSearchProps> = ({ onSearchStock }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error("Please enter a stock ticker");
      return;
    }
    
    setIsSearching(true);
    setTimeout(() => {
      onSearchStock(searchQuery.toUpperCase());
      setIsSearching(false);
      setSearchQuery('');
    }, 1000);
  };

  const handleQuickSearch = (ticker: string) => {
    onSearchStock(ticker);
    toast.success(`Loading ${ticker} data...`);
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSearch} className="flex items-center space-x-2 mb-4">
        <div className="relative flex-1">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter stock ticker (e.g. TCS, RELIANCE)"
            className="pl-10 pr-10"
          />
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button type="submit" disabled={isSearching}>
          {isSearching ? "Searching..." : "Search"}
        </Button>
      </form>

      <div className="mb-6">
        <div className="flex items-center mb-2">
          <TrendingUp className="h-4 w-4 mr-2 text-muted-foreground" />
          <h3 className="text-sm font-medium">Popular Indian Stocks</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {popularIndianStocks.map((stock) => (
            <Button
              key={stock.ticker}
              variant="outline"
              size="sm"
              onClick={() => handleQuickSearch(stock.ticker)}
              className="text-xs"
            >
              {stock.ticker}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StockSearch;
