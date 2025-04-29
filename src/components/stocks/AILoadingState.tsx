
import React from 'react';
import { Brain } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface AILoadingStateProps {
  ticker: string;
}

const AILoadingState: React.FC<AILoadingStateProps> = ({ ticker }) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
      <Brain className={`w-12 h-12 text-muted-foreground opacity-50 ${isMobile ? 'mb-2' : ''}`} />
      <div>
        <h3 className="font-medium text-lg">Generate AI Analysis</h3>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-1">
          Analyze {ticker} using technical indicators and price patterns
        </p>
      </div>
    </div>
  );
};

export default AILoadingState;
