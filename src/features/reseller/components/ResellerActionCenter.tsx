import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Circle,
  UserCircle,
  Package,
  PhoneCall,
  MessageSquare,
  AlertCircle,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import resellerService from '../services/reseller.service';
import styles from './ResellerActionCenter.module.css';

interface ActionItem {
  id: string;
  title: string;
  description: string;
  status: 'PENDING' | 'COMPLETED';
  importance: string;
  icon: React.ElementType;
  actionLabel: string;
  onAction: () => void;
}

const ResellerActionCenter: React.FC = () => {
  const { profile } = useAppSelector(state => state.reseller);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await resellerService.getRequests();
      setRequests(data.requests || []);
    } catch (error) {
      console.error('Failed to fetch requests', error);
    } finally {
      setLoading(false);
    }
  };

  // Logic for actions
  const hasRequestedProduct = requests.length > 0;
  const hasSales = requests.some(r => (r.orders || 0) > 0);
  const isProfileComplete = !!(profile?.storeName && profile?.fullName && profile?.address);
  const hasLeads = false;

  const actions: ActionItem[] = [
    {
      id: 'profile',
      title: 'Complete your profile',
      description: 'Add your store details and business information to build trust with suppliers.',
      status: isProfileComplete ? 'COMPLETED' : 'PENDING',
      importance: 'High',
      icon: UserCircle,
      actionLabel: 'Go to Settings',
      onAction: () => window.location.href = '/reseller/dashboard?tab=settings'
    },
    {
      id: 'request',
      title: 'Find your first product',
      description: 'Browse the marketplace and find high-quality products to sell.',
      status: hasRequestedProduct ? 'COMPLETED' : 'PENDING',
      importance: 'High',
      icon: Package,
      actionLabel: 'Browse Products',
      onAction: () => window.location.href = '/reseller/dashboard?tab=browse'
    },
    {
      id: 'contact',
      title: 'First supplier contact',
      description: 'Request products from suppliers to initiate your partnership.',
      status: hasRequestedProduct ? 'COMPLETED' : 'PENDING',
      importance: 'High',
      icon: PhoneCall,
      actionLabel: 'View Products',
      onAction: () => window.location.href = '/reseller/dashboard?tab=my-products'
    },
    {
      id: 'sale',
      title: 'Achieve your first sale',
      description: 'Share your storefront link and convert your first customer.',
      status: hasSales ? 'COMPLETED' : 'PENDING',
      importance: 'High',
      icon: TrendingUp,
      actionLabel: 'Go to Storefront',
      onAction: () => window.location.href = '/reseller/dashboard?tab=storefront'
    },
    {
      id: 'leads',
      title: 'Respond to leads',
      description: 'Check your incoming inquiries and convert them into sales.',
      status: hasLeads ? 'COMPLETED' : 'PENDING',
      importance: 'Medium',
      icon: MessageSquare,
      actionLabel: 'View Leads',
      onAction: () => window.location.href = '/reseller/dashboard?tab=leads'
    }
  ];

  const pendingCount = actions.filter(a => a.status === 'PENDING').length;

  if (loading) {
    return <div className={styles.loading}>Initializing Action Center...</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Action Center</h1>
          <p className={styles.subtitle}>Complete these steps to improve your visibility and performance on the platform.</p>
        </div>
        {pendingCount > 0 && (
          <div className={styles.pendingBadge}>
            <AlertCircle size={16} />
            <span>{pendingCount} actions pending</span>
          </div>
        )}
      </header>

      <div className={styles.importanceBox}>
        <div className={styles.importanceIcon}><AlertCircle size={20} /></div>
        <div className={styles.importanceText}>
          <strong>Why this matters:</strong> To keep your account active and visible, complete these actions.
        </div>
      </div>

      <div className={styles.actionGrid}>
        {actions.map(action => (
          <div key={action.id} className={`${styles.actionCard} ${action.status === 'COMPLETED' ? styles.completed : ''}`}>
            <div className={styles.cardHeader}>
              <div className={styles.iconWrapper}>
                <action.icon size={24} />
              </div>
              <div className={styles.statusBadge}>
                {action.status === 'COMPLETED' ? (
                  <><CheckCircle2 size={16} /> Completed</>
                ) : (
                  <><Circle size={16} /> Pending</>
                )}
              </div>
            </div>

            <div className={styles.cardBody}>
              <h3>{action.title}</h3>
              <p>{action.description}</p>
              <div className={styles.importanceTag}>Importance: {action.importance}</div>
            </div>

            <div className={styles.cardFooter}>
              {action.status === 'PENDING' ? (
                <button className={styles.actionBtn} onClick={action.onAction}>
                  {action.actionLabel} <ArrowRight size={16} />
                </button>
              ) : (
                <div className={styles.doneLabel}>Step Completed</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResellerActionCenter;
