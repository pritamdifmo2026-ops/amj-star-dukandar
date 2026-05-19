import React from 'react';
import LoadingPage from './LoadingPage';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
}

const sizeClasses = {
  sm: 'w-[18px] h-[18px]',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

const Loader: React.FC<LoaderProps> = ({ size = 'md', fullPage = false }) => {
  if (fullPage) return <LoadingPage />;

  return (
    <div className="flex items-center justify-center p-8">
      <span
        className={`inline-block rounded-full border-[3px] border-border border-t-primary animate-spin ${sizeClasses[size]}`}
      />
    </div>
  );
};

export default Loader;
