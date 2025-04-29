
import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface AIErrorStateProps {
  error: string;
  onDismiss: () => void;
  onRetry: () => void;
}

const AIErrorState: React.FC<AIErrorStateProps> = ({ error, onDismiss, onRetry }) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="space-y-4">
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4 mr-2" />
        <AlertTitle>Analysis Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
      <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'justify-center space-x-2'}`}>
        <Button 
          variant="outline" 
          onClick={onDismiss}
          className={isMobile ? "w-full" : ""}
        >
          Dismiss
        </Button>
        <Button 
          onClick={onRetry}
          className={isMobile ? "w-full" : ""}
        >
          <RefreshCcw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    </div>
  );
};

export default AIErrorState;
