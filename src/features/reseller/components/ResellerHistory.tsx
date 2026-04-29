import React, { useState, useEffect } from 'react';
import { History, Search, CheckCircle, XCircle, Clock } from 'lucide-react';
import resellerService from '../services/reseller.service';
import styles from './ResellerHistory.module.css';

interface Activity {
  id: string;
  type: 'REQUESTED' | 'APPROVED' | 'REJECTED';
  title: string;
  description: string;
  date: Date;
  productName: string;
  supplierName: string;
}

const ResellerHistory: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const data = await resellerService.getRequests();
      const requests = data.requests || [];

      const parsedActivities: Activity[] = [];

      requests.forEach((req: any) => {
        // Add the initial request activity
        parsedActivities.push({
          id: `${req._id}-requested`,
          type: 'REQUESTED',
          title: 'Partnership Requested',
          description: `You requested to add ${req.product?.name} from ${req.supplier?.businessName} to your storefront.`,
          date: new Date(req.requestedAt),
          productName: req.product?.name || 'Unknown Product',
          supplierName: req.supplier?.businessName || 'Unknown Supplier'
        });

        // Add the response activity if it's no longer pending
        if (req.status === 'APPROVED' && req.respondedAt) {
          parsedActivities.push({
            id: `${req._id}-approved`,
            type: 'APPROVED',
            title: 'Request Approved',
            description: `${req.supplier?.businessName} approved your request to sell ${req.product?.name}.`,
            date: new Date(req.respondedAt),
            productName: req.product?.name || 'Unknown Product',
            supplierName: req.supplier?.businessName || 'Unknown Supplier'
          });
        } else if (req.status === 'REJECTED' && req.respondedAt) {
          parsedActivities.push({
            id: `${req._id}-rejected`,
            type: 'REJECTED',
            title: 'Request Rejected',
            description: `${req.supplier?.businessName} rejected your request for ${req.product?.name}${req.rejectionReason ? ` - Reason: ${req.rejectionReason}` : ''}.`,
            date: new Date(req.respondedAt),
            productName: req.product?.name || 'Unknown Product',
            supplierName: req.supplier?.businessName || 'Unknown Supplier'
          });
        }
      });

      // Sort by date descending (newest first)
      parsedActivities.sort((a, b) => b.date.getTime() - a.date.getTime());
      setActivities(parsedActivities);
    } catch (err) {
      console.error('Failed to fetch history', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = activities.filter(activity =>
    activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'REQUESTED': return <Clock size={20} className={styles.iconRequested} />;
      case 'APPROVED': return <CheckCircle size={20} className={styles.iconApproved} />;
      case 'REJECTED': return <XCircle size={20} className={styles.iconRejected} />;
      default: return <History size={20} />;
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h2>Activity History</h2>
          <p>Track all your partnership requests, approvals, and other account activities.</p>
        </div>
        <div className={styles.searchBar}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search activities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      {loading ? (
        <div className={styles.loading}>Loading activity history...</div>
      ) : filteredActivities.length === 0 ? (
        <div className={styles.emptyState}>
          <History size={48} />
          <h3>No activities found</h3>
          <p>{searchTerm ? 'Try adjusting your search filters.' : 'Your recent account activities will appear here.'}</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Activity</th>
                <th>Product</th>
                <th>Supplier</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredActivities.map((activity) => (
                <tr key={activity.id}>
                  <td className={styles.dateCell}>
                    <div className={styles.dateText}>{activity.date.toLocaleDateString()}</div>
                    <div className={styles.timeText}>{activity.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td className={styles.activityCell}>
                    <div className={styles.activityContent}>
                      {getActivityIcon(activity.type)}
                      <div>
                        <strong>{activity.title}</strong>
                        <p>{activity.description}</p>
                      </div>
                    </div>
                  </td>
                  <td>{activity.productName}</td>
                  <td>{activity.supplierName}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[activity.type.toLowerCase()]}`}>
                      {activity.type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ResellerHistory;
