import React from 'react';
import type { LucideIcon } from 'lucide-react';
import styles from '../pages/SupplierDashboard.module.css';

interface PlaceholderViewProps {
  title: string;
  icon: LucideIcon;
  description: string;
}

const PlaceholderView: React.FC<PlaceholderViewProps> = ({ title, icon: Icon, description }) => {
  return (
    <div className={styles.placeholderContainer}>
      <div className={styles.placeholderIcon}>
        <Icon size={64} />
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
      <div className={styles.comingSoonBadge}>Coming Soon</div>
    </div>
  );
};

export default PlaceholderView;
