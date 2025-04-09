
import React from 'react';
import { Brain } from 'lucide-react';

interface AILoadingStateProps {
  ticker: string;
}

const AILoadingState: React.FC<AILoadingStateProps> = ({ ticker }) => {
  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
      <Brain className="w-12 h-12 text-muted-foreground opacity-50" />
      <div>
        <h3 className="font-medium text-lg">Generate AI Analysis</h3>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-1">
          Our AI will analyze {ticker} using technical indicators, price patterns, and market trends
        </p>
      </div>
    </div>
  );
};

export default AILoadingState;
