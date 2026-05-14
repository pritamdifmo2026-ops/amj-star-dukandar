import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, UserCircle, Package, PhoneCall, MessageSquare, AlertCircle, ArrowRight, TrendingUp } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import resellerService from '../services/reseller.service';

interface ActionItem {
  id: string; title: string; description: string;
  status: 'PENDING' | 'COMPLETED'; importance: string;
  icon: React.ElementType; actionLabel: string; onAction: () => void;
}

const ResellerActionCenter: React.FC = () => {
  const { profile } = useAppSelector(state => state.reseller);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

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

  const hasRequestedProduct = requests.length > 0;
  const hasSales = requests.some(r => (r.orders || 0) > 0);
  const isProfileComplete = !!(profile?.storeName && profile?.fullName && profile?.address);
  const hasLeads = false;

  const actions: ActionItem[] = [
    { id: 'profile', title: 'Complete your profile', description: 'Add your store details and business information to build trust with suppliers.', status: isProfileComplete ? 'COMPLETED' : 'PENDING', importance: 'High', icon: UserCircle, actionLabel: 'Go to Settings', onAction: () => window.location.href = '/reseller/dashboard?tab=settings' },
    { id: 'request', title: 'Find your first product', description: 'Browse the marketplace and find high-quality products to sell.', status: hasRequestedProduct ? 'COMPLETED' : 'PENDING', importance: 'High', icon: Package, actionLabel: 'Browse Products', onAction: () => window.location.href = '/reseller/dashboard?tab=browse' },
    { id: 'contact', title: 'First supplier contact', description: 'Request products from suppliers to initiate your partnership.', status: hasRequestedProduct ? 'COMPLETED' : 'PENDING', importance: 'High', icon: PhoneCall, actionLabel: 'View Products', onAction: () => window.location.href = '/reseller/dashboard?tab=my-products' },
    { id: 'sale', title: 'Achieve your first sale', description: 'Share your storefront link and convert your first customer.', status: hasSales ? 'COMPLETED' : 'PENDING', importance: 'High', icon: TrendingUp, actionLabel: 'Go to Storefront', onAction: () => window.location.href = '/reseller/dashboard?tab=storefront' },
    { id: 'leads', title: 'Respond to leads', description: 'Check your incoming inquiries and convert them into sales.', status: hasLeads ? 'COMPLETED' : 'PENDING', importance: 'Medium', icon: MessageSquare, actionLabel: 'View Leads', onAction: () => window.location.href = '/reseller/dashboard?tab=leads' },
  ];

  const pendingCount = actions.filter(a => a.status === 'PENDING').length;

  if (loading) return <div className="py-20 text-center text-sm text-[#64748b]">Initializing Action Center...</div>;

  return (
    <div>
      <div className="flex justify-between items-start mb-6 max-sm:flex-col max-sm:gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0f172a] m-0 mb-1">Action Center</h1>
          <p className="text-sm text-[#64748b] m-0">Complete these steps to improve your visibility and performance on the platform.</p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 bg-[#fff7ed] border border-[#fed7aa] text-[#c2410c] px-3 py-2 rounded-full text-sm font-bold shrink-0">
            <AlertCircle size={16} />
            <span>{pendingCount} actions pending</span>
          </div>
        )}
      </div>

      <div className="flex items-start gap-3 bg-[#eff6ff] border border-[#bfdbfe] rounded-[10px] px-4 py-3 mb-6 text-sm text-[#1d4ed8]">
        <AlertCircle size={18} className="shrink-0 mt-0.5" />
        <span><strong>Why this matters:</strong> To keep your account active and visible, complete these actions.</span>
      </div>

      <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
        {actions.map(action => (
          <div key={action.id} className={`bg-white border rounded-[12px] p-5 flex flex-col gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] ${action.status === 'COMPLETED' ? 'border-[#6ee7b7] bg-[#f0fdf4]' : 'border-[#eef2f6]'}`}>
            <div className="flex items-center justify-between">
              <div className={`w-12 h-12 rounded-[10px] flex items-center justify-center ${action.status === 'COMPLETED' ? 'bg-[#dcfce7] text-[#059669]' : 'bg-[#fff7ed] text-primary'}`}>
                <action.icon size={24} />
              </div>
              <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${action.status === 'COMPLETED' ? 'bg-[#dcfce7] text-[#059669]' : 'bg-[#f1f5f9] text-[#64748b]'}`}>
                {action.status === 'COMPLETED' ? <><CheckCircle2 size={13} /> Completed</> : <><Circle size={13} /> Pending</>}
              </span>
            </div>

            <div className="flex-1">
              <h3 className="text-sm font-bold text-[#0f172a] m-0 mb-1">{action.title}</h3>
              <p className="text-xs text-[#64748b] m-0 mb-3">{action.description}</p>
              <span className="text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider">Importance: {action.importance}</span>
            </div>

            <div>
              {action.status === 'PENDING' ? (
                <button className="flex items-center gap-2 w-full justify-center px-4 py-2.5 bg-primary text-white font-bold text-sm rounded-[8px] border-none cursor-pointer hover:bg-primary-dark transition-colors" onClick={action.onAction}>
                  {action.actionLabel} <ArrowRight size={15} />
                </button>
              ) : (
                <div className="text-center text-sm font-semibold text-[#059669]">Step Completed ✓</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResellerActionCenter;
