import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Filter, X, CheckCircle2, RefreshCw, UserCheck, Inbox } from 'lucide-react';
import api from '@/api/client';
import toast from 'react-hot-toast';
import Button from '@/shared/components/ui/Button';
import adminService from '../services/admin.service';

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
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('All Requirements');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [selectedSupplierToAssign, setSelectedSupplierToAssign] = useState('');

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
  }, [selectedReq?.assignedSupplierId?._id]);

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

  const assignMutation = useMutation({
    mutationFn: async ({ id, supplierId }: { id: string; supplierId: string }) => {
      const res = await api.patch(`/requirements/${id}/assign`, { supplierId });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Supplier assigned successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'requirements'] });
    },
    onError: () => toast.error('Failed to assign supplier')
  });

  const mailMutation = useMutation({
    mutationFn: async ({ id, subject, body }: { id: string; subject: string; body: string }) => {
      const res = await api.post(`/requirements/${id}/send-mail`, { subject, body });
      return res.data;
    },
    onSuccess: () => toast.success('Email sent successfully to the buyer!'),
    onError: () => toast.error('Failed to send email')
  });

  // Derived filtered items based on client-side search
  const filteredReqs = requirements.filter(r => 
    r.reqId.toLowerCase().includes(search.toLowerCase()) ||
    r.productName.toLowerCase().includes(search.toLowerCase()) ||
    r.buyerCompany.toLowerCase().includes(search.toLowerCase())
  );

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
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden flex flex-col">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab}
              className={`px-6 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
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
          <Button variant="secondary" className="flex items-center gap-2 max-sm:w-full max-sm:justify-center">
            <Filter size={16} /> Filters
          </Button>
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
                    <td className="p-4">
                      <span className="font-bold text-slate-800 text-sm block">{req.reqId}</span>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-slate-800 text-sm block">{req.productName}</span>
                      <span className="text-xs text-slate-500">{req.category}</span>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-slate-800 text-sm block">{req.buyerCompany}</span>
                      <span className="text-xs text-slate-500 block">{req.buyerEmail}</span>
                      <span className="text-xs text-slate-500 block">{req.buyerPhone}</span>
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-700">{req.quantity}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${STATUS_COLORS[req.status]}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-500">
                      <span className="block">{new Date(req.createdAt).toLocaleDateString()}</span>
                      <span className="text-xs">{new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>
                    <td className="p-4 text-center">
                      <Button variant="secondary" onClick={() => setSelectedReqId(req._id)} className="px-3 py-1.5 text-xs font-semibold">
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Right Side Detail Panel */}
      {selectedReq && (
        <div className="fixed inset-y-0 right-0 w-[480px] max-w-[100vw] bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.1)] z-50 flex flex-col border-l border-slate-200 transition-transform transform translate-x-0">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-800 m-0">Requirement Details</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-medium text-slate-600">{selectedReq.reqId}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${STATUS_COLORS[selectedReq.status]}`}>
                  {selectedReq.status}
                </span>
              </div>
            </div>
            <button onClick={() => setSelectedReqId(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
            {/* Product Information */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Product Information</h4>
              <div className="grid grid-cols-[140px_1fr] gap-y-3 text-sm">
                <span className="text-slate-500">Product Name</span>
                <span className="font-semibold text-slate-800">{selectedReq.productName}</span>
                
                <span className="text-slate-500">Category</span>
                <span className="font-medium text-slate-800">{selectedReq.category}</span>
                
                <span className="text-slate-500">Subcategory</span>
                <span className="font-medium text-slate-800">{selectedReq.subcategory}</span>
                
                <span className="text-slate-500">Quantity</span>
                <span className="font-medium text-slate-800">{selectedReq.quantity}</span>
              </div>

              {selectedReq.notes && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <span className="block text-xs font-semibold text-slate-500 mb-2">Additional Notes</span>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg leading-relaxed">
                    {selectedReq.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Buyer Information */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Buyer Information</h4>
              <div className="grid grid-cols-[140px_1fr] gap-y-3 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-slate-500">Company Name</span>
                <span className="font-semibold text-slate-800">{selectedReq.buyerCompany}</span>
                
                <span className="text-slate-500">Contact Person</span>
                <span className="font-medium text-slate-800">{selectedReq.buyerName}</span>
                
                <span className="text-slate-500">Email</span>
                <span className="font-medium text-blue-600">{selectedReq.buyerEmail}</span>
                
                <span className="text-slate-500">Phone</span>
                <span className="font-medium text-slate-800">{selectedReq.buyerPhone}</span>
                
                <span className="text-slate-500">Location</span>
                <span className="font-medium text-slate-800">{selectedReq.buyerLocation || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-col gap-3 pb-8">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Actions</h4>
            
            <div className="flex flex-col gap-2 mb-2 p-3 bg-white rounded-lg border border-slate-200">
              <label className="text-xs font-semibold text-slate-600">Assign Supplier</label>
              <div className="flex gap-2">
                <select 
                  className="flex-1 border border-slate-200 rounded text-sm px-2 py-1.5 outline-none focus:border-blue-500"
                  value={selectedSupplierToAssign}
                  onChange={(e) => setSelectedSupplierToAssign(e.target.value)}
                >
                  <option value="">Select Supplier...</option>
                  {sortedSuppliers.map(s => (
                    <option key={s._id} value={s._id}>
                      {s.businessName || s.name} (Comm: {s.commissionRate || 0}%)
                    </option>
                  ))}
                </select>
                <button
                  className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                  onClick={() => assignMutation.mutate({ id: selectedReq._id, supplierId: selectedSupplierToAssign })}
                  disabled={!selectedSupplierToAssign || assignMutation.isPending}
                >
                  Assign
                </button>
              </div>
              {selectedReq.assignedSupplierId && (
                <div className="mt-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded inline-block">
                  Assigned: {selectedReq.assignedSupplierId.businessName}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button 
                className="w-full flex justify-center items-center py-2.5 rounded-lg text-sm font-semibold transition-colors bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                onClick={() => {
                  let body = `Hello ${selectedReq.buyerName},\n\nWe have reviewed your requirement (${selectedReq.reqId}) for ${selectedReq.productName}.`;
                  if (selectedReq.assignedSupplierId) {
                    body += `\n\nWe have matched you with a verified supplier: ${selectedReq.assignedSupplierId.businessName}.\nYou can check out their products here:\nhttp://localhost:5173/supplier/${selectedReq.assignedSupplierId._id}`;
                  }
                  body += `\n\nPlease let us know if you have any questions.\n\nBest regards,\nAMJ Star Team`;
                  
                  const subject = `Regarding your AMJ Star Requirement ${selectedReq.reqId}`;
                  mailMutation.mutate({ id: selectedReq._id, subject, body });
                }}
                disabled={mailMutation.isPending}
              >
                {mailMutation.isPending ? 'Sending...' : 'Mail Buyer'}
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
      )}
    </div>
  );
};

export default RequirementManagement;
