import React, { useState, useEffect } from 'react';
import { History, Search, CheckCircle, XCircle, Clock } from 'lucide-react';
import resellerService from '../services/reseller.service';
import Pagination from '@/shared/components/ui/Pagination';

interface Activity {
  id: string; type: 'REQUESTED' | 'APPROVED' | 'REJECTED';
  title: string; description: string; date: Date;
  productName: string; supplierName: string;
}

const statusCls: Record<string, string> = {
  REQUESTED: 'bg-[#eff6ff] text-[#1d4ed8]',
  APPROVED: 'bg-[#ecfdf5] text-[#059669]',
  REJECTED: 'bg-[#fef2f2] text-[#dc2626]',
};

const thCls = "text-left px-4 py-3.5 text-[#94a3b8] text-[0.7rem] font-extrabold uppercase tracking-[0.1em] border-b border-[#f1f5f9]";
const tdCls = "px-4 py-4 border-b border-[#f8fafc] text-sm text-[#334155]";

const ResellerHistory: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      const data = await resellerService.getRequests();
      const requests = data.requests || [];
      const parsedActivities: Activity[] = [];

      requests.forEach((req: any) => {
        parsedActivities.push({ id: `${req._id}-requested`, type: 'REQUESTED', title: 'Partnership Requested', description: `You requested to add ${req.product?.name} from ${req.supplier?.businessName} to your storefront.`, date: new Date(req.requestedAt), productName: req.product?.name || 'Unknown Product', supplierName: req.supplier?.businessName || 'Unknown Supplier' });
        if (req.status === 'APPROVED' && req.respondedAt) {
          parsedActivities.push({ id: `${req._id}-approved`, type: 'APPROVED', title: 'Request Approved', description: `${req.supplier?.businessName} approved your request to sell ${req.product?.name}.`, date: new Date(req.respondedAt), productName: req.product?.name || 'Unknown Product', supplierName: req.supplier?.businessName || 'Unknown Supplier' });
        } else if (req.status === 'REJECTED' && req.respondedAt) {
          parsedActivities.push({ id: `${req._id}-rejected`, type: 'REJECTED', title: 'Request Rejected', description: `${req.supplier?.businessName} rejected your request for ${req.product?.name}${req.rejectionReason ? ` - Reason: ${req.rejectionReason}` : ''}.`, date: new Date(req.respondedAt), productName: req.product?.name || 'Unknown Product', supplierName: req.supplier?.businessName || 'Unknown Supplier' });
        }
      });

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

  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const currentActivities = filteredActivities.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getActivityIcon = (type: string) => {
    if (type === 'REQUESTED') return <Clock size={18} className="text-[#1d4ed8]" />;
    if (type === 'APPROVED') return <CheckCircle size={18} className="text-[#059669]" />;
    if (type === 'REJECTED') return <XCircle size={18} className="text-[#dc2626]" />;
    return <History size={18} />;
  };

  return (
    <div>
      <div className="flex justify-between items-start gap-4 mb-6 max-md:flex-col">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0f172a] m-0 mb-1">Activity History</h2>
          <p className="text-sm text-[#64748b] m-0">Track all your partnership requests, approvals, and other account activities.</p>
        </div>
        <div className="flex items-center gap-2 border border-[#e2e8f0] rounded-[10px] px-4 py-2.5 bg-white shadow-sm min-w-[260px] max-sm:min-w-0 max-sm:w-full focus-within:border-primary">
          <Search size={16} className="text-[#94a3b8] shrink-0" />
          <input className="border-none outline-none text-sm flex-1 bg-transparent text-[#1e293b] placeholder:text-[#94a3b8]" type="text" placeholder="Search activities..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-[#64748b]">Loading activity history...</div>
      ) : filteredActivities.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-[#64748b]">
          <History size={48} strokeWidth={1.5} />
          <h3 className="text-lg font-bold text-[#1e293b] m-0">No activities found</h3>
          <p className="text-sm m-0">{searchTerm ? 'Try adjusting your search filters.' : 'Your recent account activities will appear here.'}</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-[10px] border border-[#eef2f6] shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden mb-5">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {['Date & Time', 'Activity', 'Product', 'Supplier', 'Status'].map(h => <th key={h} className={thCls}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {currentActivities.map(activity => (
                    <tr key={activity.id} className="hover:bg-[#fafbfc]">
                      <td className={tdCls}>
                        <div className="font-semibold text-[#0f172a]">{activity.date.toLocaleDateString()}</div>
                        <div className="text-xs text-[#94a3b8]">{activity.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className={tdCls}>
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5 shrink-0">{getActivityIcon(activity.type)}</div>
                          <div>
                            <strong className="text-[#0f172a] block text-sm">{activity.title}</strong>
                            <p className="text-xs text-[#64748b] m-0 mt-0.5 max-w-[300px]">{activity.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className={`${tdCls} font-semibold text-[#0f172a]`}>{activity.productName}</td>
                      <td className={tdCls}>{activity.supplierName}</td>
                      <td className={tdCls}>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusCls[activity.type] || 'bg-[#f1f5f9] text-[#64748b]'}`}>
                          {activity.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <Pagination totalItems={filteredActivities.length} itemsPerPage={itemsPerPage} currentPage={currentPage} onPageChange={page => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
          )}
        </>
      )}
    </div>
  );
};

export default ResellerHistory;
