import React from 'react';
import { AlertCircle } from 'lucide-react';
import styles from './ErrorState.module.css';
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
    <div className={styles.container}>
      <AlertCircle size={36} color="var(--color-error)" />
      <p className={styles.message}>{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
