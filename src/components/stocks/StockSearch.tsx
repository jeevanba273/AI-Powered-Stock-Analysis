import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchIcon, TrendingUp, X } from 'lucide-react';
import { toast } from 'sonner';
import { popularIndianStocks } from '@/services/indianStockService';
import { stocksCatalog, StockInfo } from '@/data/stocksCatalog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface StockSearchProps {
  onSearchStock: (ticker: string) => void;
}

const StockSearch: React.FC<StockSearchProps> = ({ onSearchStock }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [filteredStocks, setFilteredStocks] = useState<StockInfo[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

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
      setOpen(filtered.length > 0); // Open popover only if we have results
    } else {
      setFilteredStocks([]);
      setOpen(false);
    }
  }, [searchQuery]);

  const maintainFocus = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

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
      setOpen(false);
      maintainFocus();
    }, 1000);
  };

  const handleQuickSearch = (ticker: string) => {
    onSearchStock(ticker);
    toast.success(`Loading ${ticker} data...`);
    setSearchQuery('');
    setOpen(false);
    maintainFocus();
  };

  const handleSelectStock = (stock: StockInfo) => {
    // Priority: NSE code, then BSE code
    const ticker = stock["nse-code"] ? stock["nse-code"] : stock["bse-code"];
    onSearchStock(ticker);
    toast.success(`Loading ${stock.name} (${ticker}) data...`);
    setSearchQuery('');
    setOpen(false);
    maintainFocus();
  };

  const handleItemClick = (stock: StockInfo) => {
    handleSelectStock(stock);
  };

  const handlePopoverChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      maintainFocus();
    }
  };

  const StockSearchInput = () => (
    <div 
      className="relative w-full" 
      onClick={maintainFocus}
    >
      <Input
        ref={inputRef}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search stocks by name or code..."
        className="pl-10 pr-10 w-full"
        autoComplete="off"
      />
      <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      {searchQuery && (
        <button
          type="button"
          onClick={() => {
            setSearchQuery('');
            setOpen(false);
            maintainFocus();
          }}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  return (
    <div className="w-full">
      <form onSubmit={handleSearch} className="flex items-center space-x-2 mb-4">
        <div className="relative flex-1">
          <Popover open={open} onOpenChange={handlePopoverChange}>
            <PopoverTrigger asChild>
              <div onClick={maintainFocus}>
                <StockSearchInput />
              </div>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[400px]" align="start">
              <Command>
                <CommandList>
                  {searchQuery.trim() ? (
                    <>
                      <CommandEmpty>No stocks found</CommandEmpty>
                      <CommandGroup heading="Stocks">
                        {filteredStocks.map(stock => (
                          <CommandItem
                            key={stock.id}
                            value={stock.id}
                            onSelect={() => handleItemClick(stock)}
                            className="flex flex-col items-start justify-between cursor-pointer hover:bg-accent"
                          >
                            <div className="font-medium">{stock.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {stock["nse-code"] ? `NSE: ${stock["nse-code"]}` : ''} 
                              {stock["nse-code"] && stock["bse-code"] ? ' | ' : ''}
                              {stock["bse-code"] ? `BSE: ${stock["bse-code"]}` : ''}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </>
                  ) : null}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
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
