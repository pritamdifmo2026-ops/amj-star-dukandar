import React, { useState } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, X, CheckCircle2, RefreshCw, UserCheck, Inbox, Mail, Sparkles, Package } from 'lucide-react';
import api from '@/api/client';
import toast from 'react-hot-toast';
import Button from '@/shared/components/ui/Button';
import adminService from '../services/admin.service';

interface ComposeState {
  to: string;
  subject: string;
  body: string;
}

interface Requirement {
  _id: string;
  reqId: string;
  productName: string;
  category: string;
  subcategory: string;
  quantity: string;
  notes?: string;
  buyerName: string;
  buyerCompany: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerLocation?: string;
  status: 'New' | 'In Progress' | 'Follow Up' | 'Converted' | 'Closed';
  assignedSupplierId?: { _id: string; name: string; email: string; businessName: string };
  recommendedProductId?: { _id: string; name: string; images?: string[] };
  recommendedAt?: string;
  createdAt: string;
}

const TABS = ['All Requirements', 'New', 'In Progress', 'Follow Up', 'Converted', 'Closed'];
const STATUS_COLORS = {
  'New': 'bg-blue-50 text-blue-600 border-blue-200',
  'In Progress': 'bg-orange-50 text-orange-600 border-orange-200',
  'Follow Up': 'bg-amber-50 text-amber-600 border-amber-200',
  'Converted': 'bg-green-50 text-green-600 border-green-200',
  'Closed': 'bg-slate-50 text-slate-600 border-slate-200',
};

const RequirementManagement: React.FC = () => {
  const isSmallScreen = useMediaQuery('(max-width: 1023px)');

  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('All Requirements');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [selectedSupplierToAssign, setSelectedSupplierToAssign] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [recommendDone, setRecommendDone] = useState<string | null>(null); // reqId of last successful recommend
  const [compose, setCompose] = useState<ComposeState | null>(null);

  // Fetch all suppliers for assignment
  const { data: allSuppliers = [] } = useQuery({
    queryKey: ['admin', 'suppliers'],
    queryFn: adminService.getAllSuppliers,
  });

  const sortedSuppliers = [...allSuppliers].sort((a, b) => (b.commissionRate || 0) - (a.commissionRate || 0));

  // Fetch requirements
  const { data: requirements = [], isLoading } = useQuery<Requirement[]>({
    queryKey: ['admin', 'requirements', activeTab, categoryFilter],
    queryFn: async () => {
      let url = '/requirements?';
      if (activeTab !== 'All Requirements') url += `status=${activeTab}&`;
      if (categoryFilter) url += `category=${encodeURIComponent(categoryFilter)}&`;
      const res = await api.get(url);
      return res.data.requirements;
    }
  });

  const selectedReq = requirements.find(r => r._id === selectedReqId) || null;

  // Keep dropdown in sync with selected requirement's assigned supplier
  React.useEffect(() => {
    if (selectedReq?.assignedSupplierId) {
      setSelectedSupplierToAssign(selectedReq.assignedSupplierId._id);
    } else {
      setSelectedSupplierToAssign('');
    }
    setSelectedProductId('');
    setRecommendDone(null);
  }, [selectedReq?._id]);

  // Clear product selection when supplier changes
  React.useEffect(() => {
    setSelectedProductId('');
  }, [selectedSupplierToAssign]);

  // Calculate stats
  const { data: allReqsForStats = [] } = useQuery<Requirement[]>({
    queryKey: ['admin', 'requirements', 'stats'],
    queryFn: async () => {
      const res = await api.get('/requirements');
      return res.data.requirements;
    }
  });

  const stats = {
    new: allReqsForStats.filter(r => r.status === 'New').length,
    inProgress: allReqsForStats.filter(r => r.status === 'In Progress').length,
    followUp: allReqsForStats.filter(r => r.status === 'Follow Up').length,
    converted: allReqsForStats.filter(r => r.status === 'Converted').length,
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await api.patch(`/requirements/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['admin', 'requirements'] });
    },
    onError: () => toast.error('Failed to update status')
  });


  // Products for the selected supplier (only APPROVED ones make sense to recommend)
  const { data: supplierProducts = [] } = useQuery<import('../types/admin.types').AdminProduct[]>({
    queryKey: ['admin', 'supplier-products', selectedSupplierToAssign],
    queryFn: () => adminService.getSupplierProducts(selectedSupplierToAssign),
    enabled: !!selectedSupplierToAssign,
  });
  const approvedProducts = supplierProducts.filter(p => p.status === 'APPROVED');

  const recommendMutation = useMutation({
    mutationFn: async ({ id, supplierDocId, productId }: { id: string; supplierDocId: string; productId?: string }) => {
      const res = await api.patch(`/requirements/${id}/recommend`, { supplierDocId, productId });
      return res.data;
    },
    onSuccess: (_, vars) => {
      toast.success('Supplier & product recommended! Both parties notified.');
      setRecommendDone(vars.id);
      queryClient.invalidateQueries({ queryKey: ['admin', 'requirements'] });
    },
    onError: () => toast.error('Recommendation failed. Please try again.')
  });

  // Derived filtered items based on client-side search
  const filteredReqs = requirements.filter(r =>
    r.reqId.toLowerCase().includes(search.toLowerCase()) ||
    r.productName.toLowerCase().includes(search.toLowerCase()) ||
    r.buyerCompany.toLowerCase().includes(search.toLowerCase())
  );

  const openCompose = (req: Requirement) => {
    const subject = `Regarding your Requirement ${req.reqId} — ${req.productName}`;
    let body = `Hello ${req.buyerName},\n\nThank you for submitting your requirement (${req.reqId}) for ${req.productName}`;
    if (req.quantity) body += ` (Qty: ${req.quantity})`;
    body += `.\n\n`;
    if (req.assignedSupplierId) {
      body += `We have matched you with a verified supplier: ${req.assignedSupplierId.businessName}.\n\n`;
    }
    body += `[Write your message here]\n\nBest regards,\nAMJSTAR Team`;
    setCompose({ to: req.buyerEmail, subject, body });
  };

  return (
    <div className="flex flex-col gap-6 relative min-h-screen">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <Inbox size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">New Requirements</p>
            <p className="text-2xl font-bold text-slate-800">{stats.new}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center shrink-0">
            <RefreshCw size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">In Progress</p>
            <p className="text-2xl font-bold text-slate-800">{stats.inProgress}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center shrink-0">
            <UserCheck size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Follow Ups</p>
            <p className="text-2xl font-bold text-slate-800">{stats.followUp}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Converted</p>
            <p className="text-2xl font-bold text-slate-800">{stats.converted}</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isSmallScreen ? (
        <div className="flex flex-col gap-6">
          {/* Tabs - scrollable on small screens */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
            <div className="flex border-b border-slate-200 overflow-x-auto">
              {TABS.map(tab => (
                <button
                  key={tab}
                  className={`px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            {/* Search */}
            <div className="p-3 border-b border-slate-100 bg-slate-50">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search requirements..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-primary outline-none"
                />
              </div>
            </div>
          </div>
          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredReqs.map(req => (
            <div key={req._id} className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold">{req.reqId}</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${STATUS_COLORS[req.status]}`}>{req.status}</span>
              </div>
              <div className="text-sm text-slate-600 mb-1">{req.productName} ({req.category})</div>
              <div className="text-xs text-slate-500">{req.buyerCompany}</div>
              <div className="flex justify-end mt-2">
                <Button variant="secondary" onClick={() => setSelectedReqId(req._id)} className="text-xs">View</Button>
              </div>
            </div>
          ))}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab}
                className={`px-6 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          {/* Filters */}
          <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50 max-sm:flex-col">
            <div className="relative flex-1 max-sm:w-full">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by product, buyer or ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-primary outline-none"
              />
            </div>
            <select
              className="py-2 px-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-primary max-sm:w-full"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="Agriculture">Agriculture</option>
              <option value="Electronics">Electronics</option>
              <option value="Food & Beverages">Food & Beverages</option>
              <option value="Furniture">Furniture</option>
              <option value="Home Furnishing">Home Furnishing</option>
              <option value="Machinery">Machinery</option>
              <option value="Textiles">Textiles</option>
            </select>
          </div>
          {/* Table */}
          <div className="overflow-x-auto min-h-[400px]">
            {isLoading ? (
              <div className="text-center py-12 text-slate-500">Loading requirements...</div>
            ) : filteredReqs.length === 0 ? (
              <div className="text-center py-12 text-slate-500">No requirements found.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="p-4 w-12"><input type="checkbox" className="rounded border-slate-300" /></th>
                    <th className="p-4">Req. ID</th>
                    <th className="p-4">Product Details</th>
                    <th className="p-4">Buyer Details</th>
                    <th className="p-4">Quantity</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Date</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReqs.map(req => (
                    <tr key={req._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4"><input type="checkbox" className="rounded border-slate-300" /></td>
                      <td className="p-4"><span className="font-bold text-slate-800 text-sm block">{req.reqId}</span></td>
                      <td className="p-4"><span className="font-semibold text-slate-800 text-sm block">{req.productName}</span><span className="text-xs text-slate-500">{req.category}</span></td>
                      <td className="p-4"><span className="font-semibold text-slate-800 text-sm block">{req.buyerCompany}</span><span className="text-xs text-slate-500 block">{req.buyerEmail}</span><span className="text-xs text-slate-500 block">{req.buyerPhone}</span></td>
                      <td className="p-4 text-sm font-medium text-slate-700">{req.quantity}</td>
                      <td className="p-4"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${STATUS_COLORS[req.status]}`}>{req.status}</span></td>
                      <td className="p-4 text-sm text-slate-500"><span className="block">{new Date(req.createdAt).toLocaleDateString()}</span><span className="text-xs">{new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></td>
                      <td className="p-4 text-center"><Button variant="secondary" onClick={() => setSelectedReqId(req._id)} className="px-3 py-1.5 text-xs font-semibold">View</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Right Side Detail Panel */}
      {selectedReq && (
        isSmallScreen ? (
          <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4" onClick={() => setSelectedReqId(null)}>
            <div
              className="bg-white w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Requirement Details</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-medium text-slate-500">{selectedReq.reqId}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_COLORS[selectedReq.status]}`}>{selectedReq.status}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedReqId(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
              </div>

              <div className="p-4 flex flex-col gap-5">
                {/* Product Information */}
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Product Information</h4>
                  <div className="flex flex-col gap-2.5">
                    {[
                      { label: 'Product Name', value: selectedReq.productName },
                      { label: 'Category', value: selectedReq.category },
                      { label: 'Subcategory', value: selectedReq.subcategory },
                      { label: 'Quantity', value: selectedReq.quantity },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex flex-col gap-0.5">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
                        <span className="text-sm font-medium text-slate-800 break-words">{value}</span>
                      </div>
                    ))}
                    {selectedReq.notes && (
                      <div className="flex flex-col gap-0.5 pt-2 border-t border-slate-100">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Additional Notes</span>
                        <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg leading-relaxed break-words">{selectedReq.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Buyer Information */}
                <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Buyer Information</h4>
                  <div className="flex flex-col gap-2.5">
                    {[
                      { label: 'Company Name', value: selectedReq.buyerCompany },
                      { label: 'Contact Person', value: selectedReq.buyerName },
                      { label: 'Phone', value: selectedReq.buyerPhone },
                      { label: 'Location', value: selectedReq.buyerLocation || 'N/A' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex flex-col gap-0.5">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
                        <span className="text-sm font-medium text-slate-800 break-words">{value}</span>
                      </div>
                    ))}
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Email</span>
                      <span className="text-sm font-medium text-blue-600 break-all">{selectedReq.buyerEmail}</span>
                    </div>
                  </div>
                </div>

                {/* Recommend supplier + product → notify both parties */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={13} className="text-orange-500" />
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">Recommend & Notify</label>
                  </div>

                  {selectedReq.assignedSupplierId && selectedReq.recommendedAt && (
                    <div className="text-xs bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex flex-col gap-0.5">
                      <span className="font-bold text-green-700">✓ {selectedReq.assignedSupplierId.businessName}</span>
                      {selectedReq.recommendedProductId && (
                        <span className="text-green-600 flex items-center gap-1"><Package size={11} /> {selectedReq.recommendedProductId.name}</span>
                      )}
                      <span className="text-green-600">Notified {new Date(selectedReq.recommendedAt).toLocaleDateString('en-IN')}</span>
                    </div>
                  )}

                  <select
                    className="w-full border border-slate-200 rounded-lg text-sm px-3 py-2 outline-none focus:border-orange-400 bg-white"
                    value={selectedSupplierToAssign}
                    onChange={e => setSelectedSupplierToAssign(e.target.value)}
                  >
                    <option value="">1. Select Supplier...</option>
                    {sortedSuppliers.map(s => (
                      <option key={s._id} value={s._id}>{s.businessName || s.name} ({s.commissionRate || 0}%)</option>
                    ))}
                  </select>

                  {selectedSupplierToAssign && (
                    <select
                      className="w-full border border-slate-200 rounded-lg text-sm px-3 py-2 outline-none focus:border-orange-400 bg-white"
                      value={selectedProductId}
                      onChange={e => setSelectedProductId(e.target.value)}
                    >
                      <option value="">2. Select Product...</option>
                      {approvedProducts.length === 0
                        ? <option disabled>No approved products</option>
                        : approvedProducts.map(p => (
                            <option key={p._id ?? p.id} value={p._id ?? p.id}>{p.name}</option>
                          ))
                      }
                    </select>
                  )}

                  <button
                    className="w-full flex justify-center items-center gap-2 py-2.5 rounded-xl text-sm font-bold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    disabled={!selectedSupplierToAssign || !selectedProductId || recommendMutation.isPending}
                    onClick={() => recommendMutation.mutate({ id: selectedReq._id, supplierDocId: selectedSupplierToAssign, productId: selectedProductId })}
                  >
                    <Sparkles size={14} />
                    {recommendMutation.isPending ? 'Sending…' : 'Recommend & Notify Both'}
                  </button>

                  {recommendDone === selectedReq._id && (
                    <p className="text-xs text-green-600 font-semibold text-center">✓ Both parties notified!</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 pb-4">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      className="flex justify-center items-center gap-1.5 py-3 rounded-xl text-sm font-semibold bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100"
                      onClick={() => openCompose(selectedReq)}
                    >
                      <Mail size={14} /> Mail Buyer
                    </button>
                    <button
                      className="flex justify-center items-center py-3 rounded-xl text-sm font-semibold bg-green-50 border border-green-200 text-green-700 hover:bg-green-100"
                      onClick={() => window.location.href = `tel:${selectedReq.buyerPhone}`}
                    >
                      Call Buyer
                    </button>
                  </div>
                  <button
                    className="w-full flex justify-center items-center py-3 rounded-xl text-sm font-semibold border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => updateStatusMutation.mutate({ id: selectedReq._id, status: 'Closed' })}
                    disabled={selectedReq.status === 'Closed' || updateStatusMutation.isPending}
                  >
                    Mark as Closed
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="fixed inset-y-0 right-0 w-[480px] bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.1)] z-50 flex flex-col border-l border-slate-200 transition-transform transform translate-x-0">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-800 m-0">Requirement Details</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-medium text-slate-600">{selectedReq.reqId}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${STATUS_COLORS[selectedReq.status]}`}>{selectedReq.status}</span>
                </div>
              </div>
              <button onClick={() => setSelectedReqId(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
              {/* Product Information */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Product Information</h4>
                <div className="grid grid-cols-[120px_1fr] gap-y-3 text-sm">
                  <span className="text-slate-500">Product Name</span><span className="font-semibold text-slate-800 break-words">{selectedReq.productName}</span>
                  <span className="text-slate-500">Category</span><span className="font-medium text-slate-800">{selectedReq.category}</span>
                  <span className="text-slate-500">Subcategory</span><span className="font-medium text-slate-800">{selectedReq.subcategory}</span>
                  <span className="text-slate-500">Quantity</span><span className="font-medium text-slate-800">{selectedReq.quantity}</span>
                </div>
                {selectedReq.notes && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <span className="block text-xs font-semibold text-slate-500 mb-2">Additional Notes</span>
                    <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg leading-relaxed">{selectedReq.notes}</p>
                  </div>
                )}
              </div>
              {/* Buyer Information */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Buyer Information</h4>
                <div className="grid grid-cols-[120px_1fr] gap-y-3 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="text-slate-500">Company Name</span><span className="font-semibold text-slate-800 break-words">{selectedReq.buyerCompany}</span>
                  <span className="text-slate-500">Contact Person</span><span className="font-medium text-slate-800">{selectedReq.buyerName}</span>
                  <span className="text-slate-500">Email</span><span className="font-medium text-blue-600 break-all">{selectedReq.buyerEmail}</span>
                  <span className="text-slate-500">Phone</span><span className="font-medium text-slate-800">{selectedReq.buyerPhone}</span>
                  <span className="text-slate-500">Location</span><span className="font-medium text-slate-800">{selectedReq.buyerLocation || 'N/A'}</span>
                </div>
              </div>
              {/* Action Buttons */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-col gap-3 pb-8">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Actions</h4>
                {/* Recommend supplier + product → notify both parties */}
                <div className="flex flex-col gap-2.5 p-3 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={13} className="text-orange-500" />
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Recommend Supplier & Notify</label>
                  </div>

                  {/* Already recommended banner */}
                  {selectedReq.assignedSupplierId && selectedReq.recommendedAt && (
                    <div className="flex flex-col gap-0.5 text-xs bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      <span className="font-bold text-green-700">✓ Matched: {selectedReq.assignedSupplierId.businessName}</span>
                      {selectedReq.recommendedProductId && (
                        <span className="text-green-600 flex items-center gap-1"><Package size={11} /> {selectedReq.recommendedProductId.name}</span>
                      )}
                      <span className="text-green-600">Notified on {new Date(selectedReq.recommendedAt).toLocaleDateString('en-IN')}</span>
                    </div>
                  )}

                  <select
                    className="w-full border border-slate-200 rounded text-sm px-2 py-1.5 outline-none focus:border-orange-400"
                    value={selectedSupplierToAssign}
                    onChange={e => setSelectedSupplierToAssign(e.target.value)}
                  >
                    <option value="">1. Select Supplier...</option>
                    {sortedSuppliers.map(s => (
                      <option key={s._id} value={s._id}>{s.businessName || s.name} ({s.commissionRate || 0}% comm)</option>
                    ))}
                  </select>

                  {selectedSupplierToAssign && (
                    <select
                      className="w-full border border-slate-200 rounded text-sm px-2 py-1.5 outline-none focus:border-orange-400"
                      value={selectedProductId}
                      onChange={e => setSelectedProductId(e.target.value)}
                    >
                      <option value="">2. Select Product to Recommend...</option>
                      {approvedProducts.length === 0
                        ? <option disabled>No approved products for this supplier</option>
                        : approvedProducts.map(p => (
                            <option key={p._id ?? p.id} value={p._id ?? p.id}>{p.name}</option>
                          ))
                      }
                    </select>
                  )}

                  <button
                    className="w-full flex justify-center items-center gap-2 py-2 rounded-lg text-sm font-bold transition-colors bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!selectedSupplierToAssign || !selectedProductId || recommendMutation.isPending}
                    onClick={() => recommendMutation.mutate({ id: selectedReq._id, supplierDocId: selectedSupplierToAssign, productId: selectedProductId })}
                  >
                    <Sparkles size={14} />
                    {recommendMutation.isPending ? 'Sending notifications…' : 'Recommend & Notify Both Parties'}
                  </button>

                  {recommendDone === selectedReq._id && (
                    <p className="text-xs text-green-600 font-semibold text-center">✓ Supplier and buyer notified successfully!</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className="w-full flex justify-center items-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100"
                    onClick={() => openCompose(selectedReq)}
                  >
                    <Mail size={15} /> Mail Buyer
                  </button>
                  <button
                    className="w-full flex justify-center items-center py-2.5 rounded-lg text-sm font-semibold transition-colors bg-green-50 border border-green-200 text-green-700 hover:bg-green-100"
                    onClick={() => window.location.href = `tel:${selectedReq.buyerPhone}`}
                  >
                    Call Buyer
                  </button>
                </div>
                <button
                  className="w-full flex justify-center items-center py-2.5 mt-2 rounded-lg text-sm font-semibold transition-colors border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => updateStatusMutation.mutate({ id: selectedReq._id, status: 'Closed' })}
                  disabled={selectedReq.status === 'Closed' || updateStatusMutation.isPending}
                >
                  Mark as Closed
                </button>
              </div>
            </div>
          </div>
        )
      )}

      {/* Compose Email Modal */}
      {compose && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2"><Mail size={17} /> Compose Email</h3>
              <button onClick={() => setCompose(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">To</label>
                <input
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                  value={compose.to}
                  onChange={e => setCompose(prev => prev ? { ...prev, to: e.target.value } : prev)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Subject</label>
                <input
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                  value={compose.subject}
                  onChange={e => setCompose(prev => prev ? { ...prev, subject: e.target.value } : prev)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Body</label>
                <textarea
                  rows={10}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none"
                  value={compose.body}
                  onChange={e => setCompose(prev => prev ? { ...prev, body: e.target.value } : prev)}
                />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                onClick={() => {
                  const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(compose.to)}&su=${encodeURIComponent(compose.subject)}&body=${encodeURIComponent(compose.body)}`;
                  window.open(url, '_blank');
                  setCompose(null);
                }}
              >
                Open in Gmail
              </button>
              <button
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors"
                onClick={() => {
                  navigator.clipboard.writeText(`To: ${compose.to}\nSubject: ${compose.subject}\n\n${compose.body}`);
                  toast.success('Email content copied!');
                }}
              >
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequirementManagement;
