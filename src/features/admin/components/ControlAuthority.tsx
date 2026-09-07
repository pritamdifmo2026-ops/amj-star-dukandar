import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Plus, Trash2, Edit, Copy, Check, KeyRound, CheckCircle2, Store, X, Search, Loader2, AlertTriangle } from 'lucide-react';
import Button from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';
import adminService from '../services/admin.service';
import type { SubAdmin, AdminSupplier } from '../types/admin.types';
import { useDebounce } from '@/shared/hooks/useDebounce';
import toast from 'react-hot-toast';

const AVAILABLE_PERMISSIONS = [
  { id: 'product_queue', label: 'Product Queue' },
  { id: 'supplier_verify', label: 'Supplier Verify' },
  { id: 'reseller_verify', label: 'Reseller Verify' },
  { id: 'user_management', label: 'User Management' },
  { id: 'enquiry_management', label: 'Enquiry Management' },
  { id: 'category_management', label: 'Category Management' },
  { id: 'banner_management', label: 'Banner Management' },
  { id: 'earnings', label: 'Earnings' },
  { id: 'performance', label: 'Performance' },
  { id: 'disputes', label: 'Disputes' },
  { id: 'withdrawals', label: 'Withdrawals' },
  { id: 'platform_settings', label: 'Platform Settings' },
  { id: 'pages_management', label: 'Pages Management' },
  { id: 'requirement_management', label: 'Requirement Management' },
  { id: 'buyer_queries', label: 'Buyer Queries' },
  { id: 'help_requests', label: 'Help Requests' },
  { id: 'supplier_plans', label: 'Supplier Memberships' },
];

export const ControlAuthority: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<SubAdmin | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phone, setPhone] = useState('');
  const [roleLabel, setRoleLabel] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [supplierSearch, setSupplierSearch] = useState('');
  const debouncedSupplierSearch = useDebounce(supplierSearch, 500);
  const [supplierScopeFilter, setSupplierScopeFilter] = useState<'ALL' | 'UNASSIGNED' | 'SELECTED'>('ALL');
  const [deletePrompt, setDeletePrompt] = useState<{ isOpen: boolean; id: string }>({ isOpen: false, id: '' });

  // Credentials success modal state
  const [createdCredentials, setCreatedCredentials] = useState<{
    name?: string;
    email: string;
    roleLabel: string;
    tempPassword?: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { data: subAdmins = [], isLoading } = useQuery({
    queryKey: ['admin', 'sub-admins'],
    queryFn: () => adminService.getSubAdmins(),
  });

  const { data: allSuppliers = [] } = useQuery<AdminSupplier[]>({
    queryKey: ['admin', 'all-suppliers-picker'],
    queryFn: () => adminService.getAllSuppliers(),
  });

  const copyToClipboard = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedField(null), 2500);
  };

  const inviteMutation = useMutation({
    mutationFn: adminService.inviteSubAdmin,
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sub-admins'] });
      closeModal();
      if (res?.tempPassword) {
        setCreatedCredentials({
          name: name.trim() || undefined,
          email: res.email || email,
          roleLabel: roleLabel,
          tempPassword: res.tempPassword,
        });
      } else {
        toast.success('Sub-admin invited successfully!');
      }
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to invite';
      if (msg.toLowerCase().includes('email')) {
        setEmailError(msg);
      } else {
        toast.error(msg);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminService.updateSubAdmin(id, data),
    onSuccess: () => {
      toast.success('Sub-admin updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin', 'sub-admins'] });
      closeModal();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteSubAdmin,
    onSuccess: () => {
      toast.success('Sub-admin removed!');
      queryClient.invalidateQueries({ queryKey: ['admin', 'sub-admins'] });
      setDeletePrompt({ isOpen: false, id: '' });
    },
    onError: () => toast.error('Failed to remove sub-admin'),
  });

  const openModal = (admin?: SubAdmin) => {
    if (admin) {
      setEditingAdmin(admin);
      setName(admin.name || '');
      setEmail(admin.email);
      setPhone(admin.phone && !admin.phone.startsWith('admin_') ? admin.phone : '');
      setRoleLabel(admin.adminRoleLabel || '');
      setSelectedPerms(admin.permissions || []);
      const assignedIds = (admin.assignedSuppliers || []).map((s: any) => (typeof s === 'string' ? s : s._id));
      setSelectedSuppliers(assignedIds);
    } else {
      setEditingAdmin(null);
      setName('');
      setEmail('');
      setPhone('');
      setRoleLabel('');
      setSelectedPerms([]);
      setSelectedSuppliers([]);
    }
    setSupplierSearch('');
    setSupplierScopeFilter('ALL');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAdmin(null);
    setName('');
    setEmail('');
    setEmailError('');
    setPhone('');
    setSupplierSearch('');
    setSupplierScopeFilter('ALL');
  };

  const handleSubmit = () => {
    if (!name.trim()) return toast.error('Full Name is required');
    if (!email.trim()) return toast.error('Email Address is required');
    if (!roleLabel.trim()) return toast.error('Custom Role Name is required');
    if (selectedPerms.length === 0) return toast.error('Select at least one permission');

    if (editingAdmin) {
      updateMutation.mutate({
        id: editingAdmin._id,
        data: {
          name: name.trim(),
          adminRoleLabel: roleLabel.trim(),
          permissions: selectedPerms,
          assignedSuppliers: selectedSuppliers,
          phone: phone.trim() || undefined,
        },
      });
    } else {
      inviteMutation.mutate({
        name: name.trim(),
        email: email.trim(),
        adminRoleLabel: roleLabel.trim(),
        permissions: selectedPerms,
        assignedSuppliers: selectedSuppliers,
        phone: phone.trim() || undefined,
      });
    }
  };

  const togglePerm = (permId: string) => {
    setSelectedPerms(prev =>
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  const toggleSupplier = (supplierId: string) => {
    setSelectedSuppliers(prev =>
      prev.includes(supplierId) ? prev.filter(id => id !== supplierId) : [...prev, supplierId]
    );
  };

  const isDebouncing = supplierSearch.trim() !== debouncedSupplierSearch.trim();

  const isSupplierAssignedToOther = (supplierId: string) => {
    const assignedAdmin = subAdmins.find(a =>
      (a.assignedSuppliers || []).some((asSup: any) => (asSup._id || asSup) === supplierId)
    );
    if (!assignedAdmin) return null;
    if (editingAdmin && assignedAdmin._id === editingAdmin._id) return null;
    return assignedAdmin.name || assignedAdmin.adminRoleLabel || assignedAdmin.email;
  };

  const transferredSuppliers = useMemo(() => {
    return selectedSuppliers.filter(supId => Boolean(isSupplierAssignedToOther(supId)));
  }, [selectedSuppliers, subAdmins, editingAdmin]);

  const filteredSuppliers = allSuppliers.filter(s => {
    if (supplierScopeFilter === 'SELECTED') {
      if (!selectedSuppliers.includes(s._id)) return false;
    } else if (supplierScopeFilter === 'UNASSIGNED') {
      const other = isSupplierAssignedToOther(s._id);
      if (other && !selectedSuppliers.includes(s._id)) return false;
    }

    const q = debouncedSupplierSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      (s.businessName || '').toLowerCase().includes(q) ||
      (s.name || '').toLowerCase().includes(q) ||
      (s.userId?.name || '').toLowerCase().includes(q) ||
      (s.userId?.email || '').toLowerCase().includes(q) ||
      (s.businessDetails?.city || '').toLowerCase().includes(q) ||
      (s.businessDetails?.state || '').toLowerCase().includes(q) ||
      (s.phone || '').includes(q)
    );
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-extrabold text-[#0f172a] m-0 mb-1">Control Authority</h2>
        <p className="text-sm text-[#64748b] m-0">Manage staff sub-admin accounts, assigned sellers, and permissions across the platform.</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div />
          <Button onClick={() => openModal()} className="flex items-center gap-2">
            <Plus size={18} /> Add Sub-Admin
          </Button>
        </div>

        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-sm">
                  <th className="p-4 font-semibold rounded-tl-lg">Email</th>
                  <th className="p-4 font-semibold">Role Name</th>
                  <th className="p-4 font-semibold">Assigned Scope</th>
                  <th className="p-4 font-semibold">Permissions</th>
                  <th className="p-4 font-semibold text-right rounded-tr-lg">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subAdmins.map((admin) => {
                  const hasAssigned = admin.assignedSuppliers && admin.assignedSuppliers.length > 0;
                  const supplierNames = hasAssigned
                    ? admin.assignedSuppliers!.map((s: any) => typeof s === 'string' ? s : s.businessName).join(', ')
                    : '';

                  return (
                    <tr key={admin._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-medium text-slate-800">
                        {admin.name && admin.name !== admin.email && (
                          <div className="font-bold text-slate-900 leading-tight">{admin.name}</div>
                        )}
                        <div className="text-xs text-slate-600">{admin.email}</div>
                        {admin.phone && !admin.phone.startsWith('admin_') && (
                          <div className="text-xs text-slate-400 font-normal mt-0.5">{admin.phone}</div>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-sm font-medium border border-blue-100">
                          <Shield size={14} />
                          {admin.adminRoleLabel || 'Admin'}
                        </span>
                      </td>
                      <td className="p-4">
                        {hasAssigned ? (
                          <span
                            title={supplierNames}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200 cursor-help"
                          >
                            <Store size={13} />
                            {admin.assignedSuppliers!.length} Seller{admin.assignedSuppliers!.length > 1 ? 's' : ''} Assigned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                            🌐 All Sellers (Global)
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1.5">
                          {admin.permissions?.slice(0, 3).map(p => (
                            <span key={p} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded border border-slate-200">
                              {p.replace(/_/g, ' ')}
                            </span>
                          ))}
                          {(admin.permissions?.length || 0) > 3 && (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded border border-slate-200">
                              +{(admin.permissions?.length || 0) - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openModal(admin)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Sub-Admin"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => setDeletePrompt({ isOpen: true, id: admin._id })}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Sub-Admin"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {subAdmins.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      No sub-admins found. Create one to delegate tasks.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create / Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={editingAdmin ? 'Edit Sub-Admin' : 'Invite Sub-Admin'}
          widthClass="w-[94%] max-w-[720px]"
          footer={
            <>
              <Button variant="secondary" onClick={closeModal}>Cancel</Button>
              <Button onClick={handleSubmit} loading={inviteMutation.isPending || updateMutation.isPending}>
                {editingAdmin ? 'Save Changes' : 'Send Invite & Generate Access'}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            {/* Staff Member Details Grid */}
            <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                  placeholder="e.g. Rahul Sharma"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Email Address {!editingAdmin && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="email"
                  value={email}
                  disabled={Boolean(editingAdmin)}
                  onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 outline-none ${
                    editingAdmin
                      ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                      : emailError
                        ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500 bg-white'
                        : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-500 bg-white'
                  }`}
                  placeholder="staff.name@amjstar.com"
                />
                {emailError && <p className="mt-1 text-xs text-red-500 font-medium">{emailError}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Custom Role / Designation <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={roleLabel}
                  onChange={e => setRoleLabel(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                  placeholder="e.g. Sales Manager, PSR, Account Lead"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Contact Phone / WhatsApp (Optional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                  placeholder="e.g. +91 9876543210"
                />
                <p className="text-[10px] text-slate-400 mt-1 m-0">Helpline for assigned sellers to reach out.</p>
              </div>
            </div>

            {/* Assigned Sellers Picker */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-bold text-slate-800">
                  Assigned Sellers (Optional)
                </label>
                {selectedSuppliers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedSuppliers([])}
                    className="text-xs text-red-600 hover:underline font-semibold"
                  >
                    Clear All ({selectedSuppliers.length})
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Leave empty to grant access to <strong>All Sellers</strong>. Or select specific sellers to restrict this member to their assigned accounts.
              </p>

              {/* Selected Sellers Badges */}
              {selectedSuppliers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3 p-2 bg-white rounded-lg border border-slate-200 max-h-24 overflow-y-auto">
                  {selectedSuppliers.map(supId => {
                    const found = allSuppliers.find(s => s._id === supId);
                    const name = found ? found.businessName : supId;
                    const prevAssignedTo = isSupplierAssignedToOther(supId);

                    return (
                      <span
                        key={supId}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${
                          prevAssignedTo
                            ? 'bg-amber-50 text-amber-900 border-amber-300'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        <Store size={12} />
                        <span>{name}</span>
                        {prevAssignedTo && (
                          <span className="text-[10px] text-red-700 font-bold">
                            (transfer from: {prevAssignedTo})
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleSupplier(supId)}
                          className="text-slate-500 hover:text-red-700 ml-0.5"
                        >
                          <X size={13} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Exclusive Assignment Notice */}
              {transferredSuppliers.length > 0 && (
                <div className="mb-3 p-2.5 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-xs flex items-center gap-2 animate-fade-in">
                  <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                  <span className="leading-tight">
                    <strong>Exclusive Assignment Policy:</strong> {transferredSuppliers.length} seller{transferredSuppliers.length > 1 ? 's' : ''} will be transferred to this sub-admin and automatically removed from their previous manager. No two sub-admins can manage the same supplier.
                  </span>
                </div>
              )}

              {/* Scope Filter Tabs */}
              <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSupplierScopeFilter('ALL')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
                    supplierScopeFilter === 'ALL'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  All Sellers ({allSuppliers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSupplierScopeFilter('UNASSIGNED')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
                    supplierScopeFilter === 'UNASSIGNED'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Available (Unassigned)
                </button>
                {selectedSuppliers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSupplierScopeFilter('SELECTED')}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
                      supplierScopeFilter === 'SELECTED'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Selected ({selectedSuppliers.length})
                  </button>
                )}
              </div>

              {/* Search Bar with 500ms Debounce Indicator & Clear */}
              <div className="relative mb-2">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={supplierSearch}
                  onChange={e => setSupplierSearch(e.target.value)}
                  placeholder="Search sellers by store, owner, city or phone..."
                  className="w-full pl-8 pr-8 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {isDebouncing && (
                    <span title="Debouncing 500ms...">
                      <Loader2 size={13} className="animate-spin text-blue-500" />
                    </span>
                  )}
                  {supplierSearch && (
                    <button
                      type="button"
                      onClick={() => setSupplierSearch('')}
                      className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                      title="Clear search"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-2 max-h-48 overflow-y-auto p-1 bg-white rounded-lg border border-slate-200">
                {filteredSuppliers.slice(0, 50).map(s => {
                  const isSelected = selectedSuppliers.includes(s._id);
                  const location = [s.businessDetails?.city, s.businessDetails?.state].filter(Boolean).join(', ');
                  const assignedToOther = isSupplierAssignedToOther(s._id);
                  const isAssignedToThis = editingAdmin && (
                    (s as any).accountManagerId === editingAdmin._id ||
                    (editingAdmin.assignedSuppliers || []).some((asSup: any) => (asSup._id || asSup) === s._id)
                  );

                  return (
                    <label
                      key={s._id}
                      className={`flex items-start gap-2.5 p-2 rounded-md border text-xs cursor-pointer transition-colors ${
                        isSelected
                          ? assignedToOther
                            ? 'bg-amber-50/90 border-amber-300 text-amber-950 font-semibold'
                            : 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                          : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSupplier(s._id)}
                        className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-slate-800 flex items-center gap-1 flex-wrap leading-snug">
                          <span className="truncate">{s.businessName || 'Unnamed Store'}</span>
                          {assignedToOther && !isSelected && (
                            <span className="text-[10px] text-amber-800 font-medium bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded whitespace-nowrap">
                              (assigned to {assignedToOther})
                            </span>
                          )}
                          {assignedToOther && isSelected && (
                            <span className="text-[10px] text-red-700 font-bold bg-red-100 border border-red-300 px-1.5 py-0.2 rounded whitespace-nowrap">
                              ⚡ Transfers from {assignedToOther}
                            </span>
                          )}
                          {isAssignedToThis && (
                            <span className="text-[10px] text-emerald-700 font-medium bg-emerald-100 border border-emerald-300 px-1.5 py-0.2 rounded whitespace-nowrap">
                              (assigned to this member)
                            </span>
                          )}
                        </div>
                        {location && (
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">{location}</div>
                        )}
                      </div>
                    </label>
                  );
                })}
                {filteredSuppliers.length === 0 && (
                  <div className="col-span-2 text-center text-xs text-slate-400 py-4">
                    {isDebouncing ? 'Searching...' : `No sellers found matching filter`}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Permissions</label>
              <div className="grid grid-cols-3 max-sm:grid-cols-2 gap-2.5 max-h-[260px] overflow-y-auto p-1">
                {AVAILABLE_PERMISSIONS.map(perm => (
                  <label key={perm.id} className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      checked={selectedPerms.includes(perm.id)}
                      onChange={() => togglePerm(perm.id)}
                    />
                    <span className="text-xs font-medium text-slate-700 leading-snug">{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Modal>

        {/* Credentials Success Modal */}
        <Modal
          isOpen={createdCredentials !== null}
          onClose={() => setCreatedCredentials(null)}
          title="Sub-Admin Credentials Created"
          widthClass="w-[92%] max-w-[500px]"
          footer={
            <div className="w-full flex justify-between items-center">
              <Button
                variant="secondary"
                onClick={() => {
                  const loginUrl = `${window.location.origin}/admin/login`;
                  const text = `AMJSTAR Staff Portal Access\n${createdCredentials?.name ? `Name: ${createdCredentials.name}\n` : ''}Role: ${createdCredentials?.roleLabel}\nEmail: ${createdCredentials?.email}\nTemp Password: ${createdCredentials?.tempPassword}\nLogin Portal: ${loginUrl}`;
                  copyToClipboard(text, 'all');
                }}
                className="flex items-center gap-1.5 text-xs"
              >
                {copiedField === 'all' ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                {copiedField === 'all' ? 'Copied All!' : 'Copy All Details'}
              </Button>
              <Button onClick={() => setCreatedCredentials(null)}>Done</Button>
            </div>
          }
        >
          <div className="py-2 space-y-4">
            <div className="flex items-center gap-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-950 m-0">Account Created Successfully!</h3>
                <p className="text-xs text-emerald-700 m-0 mt-0.5">
                  Share these login credentials with <strong>{createdCredentials?.name || createdCredentials?.roleLabel}</strong>.
                </p>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              {/* Member Name */}
              {createdCredentials?.name && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Staff Member Name
                  </label>
                  <div className="bg-white px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-900">
                    {createdCredentials.name}
                  </div>
                </div>
              )}

              {/* Email / ID */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Email / Login ID
                </label>
                <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200">
                  <span className="text-xs font-semibold text-slate-800 font-mono">{createdCredentials?.email}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(createdCredentials?.email || '', 'email')}
                    className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                    title="Copy Email"
                  >
                    {copiedField === 'email' ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
                  </button>
                </div>
              </div>

              {/* Temporary Password */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Temporary Password
                </label>
                <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-amber-200 bg-amber-50/30">
                  <span className="text-sm font-extrabold text-amber-900 font-mono tracking-wider">
                    {createdCredentials?.tempPassword}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(createdCredentials?.tempPassword || '', 'password')}
                    className="text-amber-700 hover:text-amber-950 transition-colors p-1"
                    title="Copy Password"
                  >
                    {copiedField === 'password' ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Notice */}
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs leading-relaxed">
              <KeyRound size={16} className="shrink-0 mt-0.5 text-amber-600" />
              <div>
                <strong className="font-bold">Temporary Password Notice:</strong> This is a temporary password. The member will be required to create their own secure password immediately upon their first login.
              </div>
            </div>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deletePrompt.isOpen}
          onClose={() => setDeletePrompt({ isOpen: false, id: '' })}
          title="Remove Sub-Admin"
          footer={
            <>
              <Button variant="secondary" onClick={() => setDeletePrompt({ isOpen: false, id: '' })}>Cancel</Button>
              <Button variant="danger" onClick={() => deleteMutation.mutate(deletePrompt.id)} loading={deleteMutation.isPending}>
                Confirm Remove
              </Button>
            </>
          }
        >
          <div className="py-2">
            <div className="mx-auto w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
              <Trash2 size={24} />
            </div>
            <p className="text-center font-medium text-slate-800 mb-2">Are you sure you want to remove this sub-admin?</p>
            <p className="text-center text-sm text-slate-500">
              Their access will be immediately revoked. You can re-invite them later if needed.
            </p>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default ControlAuthority;
