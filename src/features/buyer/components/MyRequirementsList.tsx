import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { buyerProfileApi } from '../services/buyer-profile.api';
import type { PostedRequirement } from '../services/buyer-profile.api';
import { ClipboardList, Clock, CheckCircle, XCircle, Mail, Building2, Package, Tag, Layers, FileText } from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; Icon: React.FC<any> }> = {
  'New':         { label: 'New',          color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd', Icon: Clock },
  'In Progress': { label: 'In Progress',  color: '#b45309', bg: '#fef3c7', border: '#fde68a', Icon: ClipboardList },
  'Follow Up':   { label: 'Follow Up',    color: '#6d28d9', bg: '#f5f3ff', border: '#ddd6fe', Icon: Clock },
  'Converted':   { label: 'Converted',    color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', Icon: CheckCircle },
  'Closed':      { label: 'Closed',       color: '#4b5563', bg: '#f3f4f6', border: '#e5e7eb', Icon: XCircle },
};

const getStatusConfig = (status: string) =>
  STATUS_CONFIG[status] ?? { label: status, color: '#64748b', bg: '#f8fafc', border: '#e2e8f0', Icon: Clock };

const MyRequirementsList: React.FC = () => {
  const [, setSearchParams] = useSearchParams();
  const [requirements, setRequirements] = useState<PostedRequirement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequirements();
  }, []);

  const fetchRequirements = async () => {
    try {
      const list = await buyerProfileApi.getMyRequirements();
      setRequirements(list);
    } catch (err) {
      console.error('Failed to fetch buyer requirements', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-[#64748b]">
        <div className="w-8 h-8 border-2 border-[#e2e8f0] border-t-primary rounded-full animate-spin" />
        <p className="text-sm m-0">Loading your requirements...</p>
      </div>
    );
  }

  if (requirements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center text-[#64748b] bg-white border border-[#eef2f6] rounded-[16px] p-8 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div className="w-16 h-16 bg-[#fff7ed] text-primary rounded-full flex items-center justify-center mb-2">
          <ClipboardList size={32} />
        </div>
        <h3 className="text-lg font-bold text-[#1e293b] m-0">No Requirements Found</h3>
        <p className="text-sm max-w-md m-0 leading-relaxed">
          You haven't posted any requirements yet. To post a new requirement, please submit it using the{' '}
          <button
            onClick={() => {
              setSearchParams({ tab: 'overview', scrollTo: 'requirement' });
            }}
            className="font-bold text-primary underline cursor-pointer bg-transparent border-none p-0"
          >
            Post Your Requirement
          </button>{' '}
          form on our home page.
        </p>
        <p className="text-xs text-[#94a3b8] mt-1 m-0">
          Need help? Contact our helpline at 9034440673.
        </p>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-extrabold text-[#0f172a] m-0">My Requirements ({requirements.length})</h3>
          <p className="text-xs text-[#64748b] m-0 mt-0.5">Track your submitted product requirements and supplier matches</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {requirements.map((req) => {
          const cfg = getStatusConfig(req.status);
          const StatusIcon = cfg.Icon;
          return (
            <div key={req._id} className="bg-white border border-[#eef2f6] rounded-[12px] shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all overflow-hidden">
              <div className="p-5 flex flex-col gap-4">
                {/* Header info */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-primary bg-[#fff7ed] px-2.5 py-1 rounded-full">{req.reqId}</span>
                    <span className="text-xs text-[#94a3b8]">
                      {new Date(req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div
                    className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border"
                    style={{ color: cfg.color, backgroundColor: cfg.bg, borderColor: cfg.border }}
                  >
                    <StatusIcon size={12} />
                    {cfg.label}
                  </div>
                </div>

                {/* Details layout */}
                <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1 border-t border-[#f8fafc] pt-4">
                  {/* Column 1: Product info */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm text-[#475569]">
                      <Package size={15} className="text-primary shrink-0" />
                      <span className="font-semibold text-[#1e293b]">{req.productName}</span>
                    </div>
                    {req.category && (
                      <div className="flex items-center gap-2 text-xs text-[#64748b]">
                        <Tag size={13} className="text-[#94a3b8] shrink-0" />
                        <span>Category: {req.category}</span>
                      </div>
                    )}
                    {req.subcategory && (
                      <div className="flex items-center gap-2 text-xs text-[#64748b]">
                        <Layers size={13} className="text-[#94a3b8] shrink-0" />
                        <span>Subcategory: {req.subcategory}</span>
                      </div>
                    )}
                  </div>

                  {/* Column 2: Quantity & Notes */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start gap-2 text-xs text-[#64748b]">
                      <span className="font-bold text-[#475569] shrink-0">Quantity:</span>
                      <span className="text-[#1e293b] font-medium">{req.quantity || 'Not specified'}</span>
                    </div>
                    {req.notes && (
                      <div className="flex items-start gap-2 text-xs text-[#64748b]">
                        <FileText size={13} className="text-[#94a3b8] shrink-0 mt-0.5" />
                        <span className="line-clamp-2 leading-relaxed" title={req.notes}>{req.notes}</span>
                      </div>
                    )}
                  </div>

                  {/* Column 3: Assigned Supplier Info */}
                  <div className="bg-[#f8fafc] rounded-[8px] p-3 border border-[#eef2f6] flex flex-col gap-1.5 justify-center">
                    <span className="text-[10px] font-extrabold uppercase text-[#94a3b8] tracking-wider block">Assigned Supplier</span>
                    {req.assignedSupplierId ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-[#1e293b] flex items-center gap-1.5">
                          <Building2 size={12} className="text-[#64748b]" />
                          {req.assignedSupplierId.businessName || req.assignedSupplierId.name}
                        </span>
                        <div className="flex items-center gap-3 text-[11px] text-[#64748b]">
                          <span className="flex items-center gap-1">
                            <Mail size={11} className="text-[#94a3b8]" />
                            {req.assignedSupplierId.email}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-[#94a3b8] italic">Supplier matching in progress...</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyRequirementsList;
