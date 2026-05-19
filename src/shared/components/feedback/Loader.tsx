import React from 'react';
import LoadingPage from './LoadingPage';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
}

const sizeMap = {
  sm: 'w-[18px] h-[18px]',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

const Loader: React.FC<LoaderProps> = ({ size = 'md', fullPage = false }) => {
  const spinner = (
    <span
      className={`inline-block rounded-full border-[3px] border-slate-200 border-t-[var(--color-primary)] animate-spin ${sizeMap[size]}`}
    />
  );

  if (fullPage) {
    return <LoadingPage />;
  }

  return <div className="flex items-center justify-center p-8">{spinner}</div>;
};

export default Loader;
