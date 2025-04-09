
import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface AIErrorStateProps {
  error: string;
  onDismiss: () => void;
  onRetry: () => void;
}

const AIErrorState: React.FC<AIErrorStateProps> = ({ error, onDismiss, onRetry }) => {
  return (
    <div className="space-y-4">
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4 mr-2" />
        <AlertTitle>Analysis Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
      <div className="flex justify-center">
        <Button 
          variant="outline" 
          onClick={onDismiss}
          className="mr-2"
        >
          Dismiss
        </Button>
        <Button onClick={onRetry}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    </div>
  );
};

export default AIErrorState;
