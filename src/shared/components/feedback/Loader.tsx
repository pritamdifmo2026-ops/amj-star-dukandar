import React from 'react';
import styles from './Loader.module.css';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
}

const Loader: React.FC<LoaderProps> = ({ size = 'md', fullPage = false }) => {
  const spinner = <span className={[styles.spinner, styles[size]].join(' ')} />;

  if (fullPage) {
    return <div className={styles.fullPage}>{spinner}</div>;
  }

  return <div className={styles.inline}>{spinner}</div>;
};

export default Loader;
