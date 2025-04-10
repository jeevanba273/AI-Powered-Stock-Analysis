import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchIcon, TrendingUp, X } from 'lucide-react';
import { toast } from 'sonner';
import { popularIndianStocks } from '@/services/indianStockService';
import { stocksCatalog, StockInfo } from '@/data/stocksCatalog';

interface StockSearchProps {
  onSearchStock: (ticker: string) => void;
}

const StockSearch: React.FC<StockSearchProps> = ({ onSearchStock }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [filteredStocks, setFilteredStocks] = useState<StockInfo[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Filter stocks when search query changes
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const filtered = stocksCatalog.filter(stock => {
        const query = searchQuery.toLowerCase();
        return (
          stock.name.toLowerCase().includes(query) ||
          (stock["nse-code"] && stock["nse-code"].toLowerCase().includes(query)) ||
          (stock["bse-code"] && stock["bse-code"].toLowerCase().includes(query))
        );
      }).slice(0, 10); // Limit to 10 results
      
      setFilteredStocks(filtered);
      setShowResults(filtered.length > 0);
    } else {
      setFilteredStocks([]);
      setShowResults(false);
    }
  }, [searchQuery]);

  // Handle click outside to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current && 
        !resultsRef.current.contains(event.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
      setShowResults(false);
    }, 1000);
  };

  const handleQuickSearch = (ticker: string) => {
    onSearchStock(ticker);
    toast.success(`Loading ${ticker} data...`);
    setSearchQuery('');
    setShowResults(false);
  };

  const handleSelectStock = (stock: StockInfo) => {
    // Priority: NSE code, then BSE code
    const ticker = stock["nse-code"] ? stock["nse-code"] : stock["bse-code"];
    onSearchStock(ticker);
    toast.success(`Loading ${stock.name} (${ticker}) data...`);
    setSearchQuery('');
    setShowResults(false);
  };

  const handleClearSearch = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSearchQuery('');
    setShowResults(false);
    // Focus the input after clearing
    inputRef.current?.focus();
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSearch} className="flex items-center space-x-2 mb-4">
        <div className="relative flex-1">
          <div className="relative w-full">
            <Input
              ref={inputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim() && filteredStocks.length > 0) {
                  setShowResults(true);
                }
              }}
              placeholder="Search stocks by name or code..."
              className="pl-10 pr-10 w-full"
              autoComplete="off"
              autoFocus
            />
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {/* Results dropdown - separate from input */}
          {showResults && (
            <div 
              ref={resultsRef}
              className="absolute z-50 top-full mt-1 w-full bg-popover rounded-md border shadow-lg"
            >
              <div className="p-2">
                {filteredStocks.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    No stocks found
                  </div>
                ) : (
                  <div>
                    <div className="text-xs font-medium px-2 py-1.5 text-muted-foreground">
                      Stocks
                    </div>
                    {filteredStocks.map(stock => (
                      <div
                        key={stock.id}
                        onClick={() => handleSelectStock(stock)}
                        className="flex flex-col items-start justify-between p-2 cursor-pointer rounded-sm hover:bg-accent"
                      >
                        <div className="font-medium">{stock.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {stock["nse-code"] ? `NSE: ${stock["nse-code"]}` : ''} 
                          {stock["nse-code"] && stock["bse-code"] ? ' | ' : ''}
                          {stock["bse-code"] ? `BSE: ${stock["bse-code"]}` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
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