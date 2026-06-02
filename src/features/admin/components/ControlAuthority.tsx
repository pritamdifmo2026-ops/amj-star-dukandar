import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Plus, Trash2, Edit } from 'lucide-react';
import Button from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';
import adminService from '../services/admin.service';
import type { SubAdmin } from '../types/admin.types';
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
  { id: 'withdrawals', label: 'Withdrawals' },
  { id: 'platform_settings', label: 'Platform Settings' },
  { id: 'pages_management', label: 'Pages Management' },
  { id: 'requirement_management', label: 'Requirement Management' },
];

const ControlAuthority: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<SubAdmin | null>(null);

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [roleLabel, setRoleLabel] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [deletePrompt, setDeletePrompt] = useState<{ isOpen: boolean; id: string }>({ isOpen: false, id: '' });

  const { data: subAdmins = [], isLoading } = useQuery({
    queryKey: ['admin', 'sub-admins'],
    queryFn: () => adminService.getSubAdmins(),
  });

  const inviteMutation = useMutation({
    mutationFn: adminService.inviteSubAdmin,
    onSuccess: () => {
      toast.success('Sub-admin invited successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin', 'sub-admins'] });
      closeModal();
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
      setEmail(admin.email);
      setRoleLabel(admin.adminRoleLabel || '');
      setSelectedPerms(admin.permissions || []);
    } else {
      setEditingAdmin(null);
      setEmail('');
      setRoleLabel('');
      setSelectedPerms([]);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAdmin(null);
    setEmailError('');
  };

  const handleSubmit = () => {
    if (!email || !roleLabel) return toast.error('Email and Role Name are required');
    if (selectedPerms.length === 0) return toast.error('Select at least one permission');

    if (editingAdmin) {
      updateMutation.mutate({
        id: editingAdmin._id,
        data: { adminRoleLabel: roleLabel, permissions: selectedPerms },
      });
    } else {
      inviteMutation.mutate({ email, adminRoleLabel: roleLabel, permissions: selectedPerms });
    }
  };

  const togglePerm = (permId: string) => {
    setSelectedPerms(prev =>
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-extrabold text-[#0f172a] m-0 mb-1">Control Authority</h2>
        <p className="text-sm text-[#64748b] m-0">Manage sub-admin accounts and their access permissions across the platform.</p>
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
                <th className="p-4 font-semibold">Permissions</th>
                <th className="p-4 font-semibold text-right rounded-tr-lg">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subAdmins.map((admin) => (
                <tr key={admin._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-medium text-slate-800">{admin.email}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-sm font-medium border border-blue-100">
                      <Shield size={14} />
                      {admin.adminRoleLabel || 'Admin'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1.5">
                      {admin.permissions?.slice(0, 3).map(p => (
                        <span key={p} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded border border-slate-200">
                          {p.replace('_', ' ')}
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
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => setDeletePrompt({ isOpen: true, id: admin._id })}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {subAdmins.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    No sub-admins found. Create one to delegate tasks.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingAdmin ? 'Edit Sub-Admin' : 'Invite Sub-Admin'}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSubmit} loading={inviteMutation.isPending || updateMutation.isPending}>
              {editingAdmin ? 'Save Changes' : 'Send Invite'}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {!editingAdmin && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none ${emailError ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'}`}
                placeholder="manager@example.com"
              />
              {emailError && <p className="mt-1 text-sm text-red-500 font-medium">{emailError}</p>}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Custom Role Name</label>
            <input
              type="text"
              value={roleLabel}
              onChange={e => setRoleLabel(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              placeholder="e.g. Sales Manager, Product Manager"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Permissions</label>
            <div className="grid grid-cols-2 gap-3 max-h-[250px] overflow-y-auto p-1">
              {AVAILABLE_PERMISSIONS.map(perm => (
                <label key={perm.id} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    checked={selectedPerms.includes(perm.id)}
                    onChange={() => togglePerm(perm.id)}
                  />
                  <span className="text-sm font-medium text-slate-700">{perm.label}</span>
                </label>
              ))}
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
