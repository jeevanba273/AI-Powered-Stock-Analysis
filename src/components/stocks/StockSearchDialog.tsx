
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, X } from 'lucide-react';
import { stocksCatalog, StockInfo } from '@/data/stocksCatalog';
import { toast } from 'sonner';

interface StockSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectStock: (ticker: string) => void;
}

const StockSearchDialog: React.FC<StockSearchDialogProps> = ({ 
  open, 
  onOpenChange,
  onSelectStock 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleSelectStock = (stock: StockInfo) => {
    // Priority: NSE code, then BSE code
    const ticker = stock["nse-code"] ? stock["nse-code"] : stock["bse-code"];
    onSelectStock(ticker);
    onOpenChange(false);
    setSearchQuery('');
    toast.success(`Loading ${stock.name} (${ticker}) data...`);
  };
  
  const filteredStocks = stocksCatalog.filter(stock => {
    const query = searchQuery.toLowerCase();
    return (
      stock.name.toLowerCase().includes(query) ||
      stock["nse-code"].toLowerCase().includes(query) ||
      stock["bse-code"].toLowerCase().includes(query)
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl">Search Stocks</DialogTitle>
          <button 
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 h-9 w-9 border border-input bg-background hover:bg-accent"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogHeader>
        
        <Command className="rounded-lg border shadow-md">
          <CommandInput
            placeholder="Search stocks by name or code..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList className="max-h-[300px] overflow-y-auto">
            <CommandEmpty>No stocks found</CommandEmpty>
            <CommandGroup heading="Stocks">
              {filteredStocks.map(stock => (
                <CommandItem
                  key={stock.id}
                  value={stock.id}
                  onSelect={() => handleSelectStock(stock)}
                  className="flex items-center justify-between cursor-pointer hover:bg-accent"
                >
                  <div>
                    <div>{stock.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {stock["nse-code"] ? `NSE: ${stock["nse-code"]}` : ''} 
                      {stock["nse-code"] && stock["bse-code"] ? ' | ' : ''}
                      {stock["bse-code"] ? `BSE: ${stock["bse-code"]}` : ''}
                    </div>
                  </div>
                  <Check className="h-4 w-4 text-primary opacity-0 group-data-[selected=true]:opacity-100" />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
};

export default StockSearchDialog;
