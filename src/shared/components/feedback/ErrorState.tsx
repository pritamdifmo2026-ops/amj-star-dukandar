import React from 'react';
import { AlertCircle } from 'lucide-react';
import Button from '../ui/Button';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Something went wrong. Please try again.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center gap-4 py-12 px-4 text-center">
      <AlertCircle size={36} color="var(--color-error)" />
      <p className="text-base text-body max-w-[360px]">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
