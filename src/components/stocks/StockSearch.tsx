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
      setOpen(filtered.length > 0);
    } else {
      setFilteredStocks([]);
      setOpen(false);
    }
  }, [searchQuery]);

  // This function maintains focus on the input element without causing re-renders
  const maintainFocus = () => {
    // We don't want to use a setTimeout here as it can cause flickering
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
  };

  const handleItemClick = (stock: StockInfo) => {
    handleSelectStock(stock);
  };

  // Modified to keep the focus in the input field and only update popover state
  const handlePopoverChange = (isOpen: boolean) => {
    // Only update open state, but don't re-focus if dropdown is opening
    // This prevents the focus from being disturbed while typing
    setOpen(isOpen && filteredStocks.length > 0);
    
    // Always maintain focus on the input if popover is closing
    if (!isOpen) {
      maintainFocus();
    }
  };

  // Handle input change without disturbing focus
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Clear search without losing focus
  const handleClearSearch = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSearchQuery('');
    setOpen(false);
    maintainFocus();
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSearch} className="flex items-center space-x-2 mb-4">
        <div className="relative flex-1">
          <Popover open={open} onOpenChange={handlePopoverChange}>
            <PopoverTrigger asChild>
              <div className="relative w-full">
                <Input
                  ref={inputRef}
                  value={searchQuery}
                  onChange={handleInputChange}
                  onClick={maintainFocus}
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
