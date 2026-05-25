import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import adminService from '../services/admin.service';
import type {
  AdminStats, AdminSupplier, AdminReseller,
  AdminProduct, AdminUser, MessageModalState, VerifyEntityType
} from '../types/admin.types';

const TABS_SUPPLIERS = ['suppliers', 'supplier-detail', 'supplier-products'];
const TABS_RESELLERS = ['resellers', 'reseller-detail'];

export const useAdminDashboard = (activeTab: string) => {
  const queryClient = useQueryClient();

  // ── UI state (stays local, not server data) ────────────────────────
  const [messageModal, setMessageModal] = useState<MessageModalState>({
    isOpen: false, title: '', message: '', type: 'info'
  });
  const [confirmVerify, setConfirmVerify] = useState<{
    isOpen: boolean; id: string; type: VerifyEntityType
  }>({ isOpen: false, id: '', type: 'supplier' });
  const [rejectPrompt, setRejectPrompt] = useState<{
    isOpen: boolean; id: string; type: VerifyEntityType
  }>({ isOpen: false, id: '', type: 'supplier' });
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  // ── Server state via React Query ───────────────────────────────────
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminService.getStats(),
    enabled: activeTab === 'stats',
  });

  const { data: allSuppliers = [], isLoading: suppliersLoading } = useQuery<AdminSupplier[]>({
    queryKey: ['admin', 'suppliers'],
    queryFn: () => adminService.getAllSuppliers(),
    enabled: TABS_SUPPLIERS.includes(activeTab),
  });

  const { data: allResellers = [], isLoading: resellersLoading } = useQuery<AdminReseller[]>({
    queryKey: ['admin', 'resellers'],
    queryFn: () => adminService.getAllResellers(),
    enabled: TABS_RESELLERS.includes(activeTab),
  });

  const { data: allUsers = [], isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ['admin', 'users'],
    queryFn: () => adminService.getAllUsers(),
    enabled: activeTab === 'users',
  });

  const { data: pendingProducts = [], isLoading: pendingLoading } = useQuery<AdminProduct[]>({
    queryKey: ['admin', 'products', 'pending'],
    queryFn: () => adminService.getPendingProducts(),
    enabled: activeTab === 'products',
  });

  const { data: approvedProducts = [], isLoading: approvedLoading } = useQuery<AdminProduct[]>({
    queryKey: ['admin', 'products', 'approved'],
    queryFn: () => adminService.getAllProducts(),
    enabled: activeTab === 'products',
  });

  const loading =
    statsLoading || suppliersLoading || resellersLoading ||
    usersLoading || pendingLoading || approvedLoading;

  // ── Handlers ───────────────────────────────────────────────────────
  const showMessage = (title: string, message: string, type: MessageModalState['type']) =>
    setMessageModal({ isOpen: true, title, message, type });

  const handleVerifySupplier = async (id: string, status: 'VERIFIED' | 'REJECTED'): Promise<void> => {
    if (status === 'VERIFIED') {
      setConfirmVerify({ isOpen: true, id, type: 'supplier' });
    } else {
      setRejectPrompt({ isOpen: true, id, type: 'supplier' });
      setRejectionReasonInput('');
    }
  };

  const handleVerifyReseller = async (id: string, status: 'APPROVED' | 'REJECTED'): Promise<void> => {
    if (status === 'APPROVED') {
      setConfirmVerify({ isOpen: true, id, type: 'reseller' });
    } else {
      setRejectPrompt({ isOpen: true, id, type: 'reseller' });
      setRejectionReasonInput('');
    }
  };

  const executeVerify = async () => {
    const { id, type } = confirmVerify;
    try {
      if (type === 'supplier') {
        await adminService.verifySupplier(id, 'VERIFIED');
        queryClient.invalidateQueries({ queryKey: ['admin', 'suppliers'] });
      } else {
        await adminService.verifyReseller(id, 'APPROVED');
        queryClient.invalidateQueries({ queryKey: ['admin', 'resellers'] });
      }
      setConfirmVerify({ isOpen: false, id: '', type: 'supplier' });
      showMessage('Success', `${type === 'supplier' ? 'Supplier' : 'Reseller'} verified successfully`, 'success');
    } catch {
      showMessage('Error', 'Action failed', 'error');
    }
  };

  const executeReject = async () => {
    const { id, type } = rejectPrompt;
    if (!rejectionReasonInput.trim()) { alert('Please provide a reason'); return; }
    try {
      if (type === 'supplier') {
        await adminService.verifySupplier(id, 'REJECTED', rejectionReasonInput);
        queryClient.invalidateQueries({ queryKey: ['admin', 'suppliers'] });
      } else {
        await adminService.verifyReseller(id, 'REJECTED', rejectionReasonInput);
        queryClient.invalidateQueries({ queryKey: ['admin', 'resellers'] });
      }
      setRejectPrompt({ isOpen: false, id: '', type: 'supplier' });
      showMessage('Success', `${type === 'supplier' ? 'Supplier' : 'Reseller'} rejected successfully`, 'success');
    } catch {
      showMessage('Error', 'Action failed', 'error');
    }
  };

  const handleVerifyProduct = async (id: string, status: 'APPROVED' | 'REJECTED', reason?: string) => {
    try {
      await adminService.verifyProduct(id, status, reason);
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      showMessage('Success', `Product ${status.toLowerCase()} successfully`, 'success');
    } catch {
      showMessage('Error', 'Action failed', 'error');
    }
  };

  const handleToggleUserStatus = async (id: string, currentStatus: boolean) => {
    try {
      await adminService.toggleUserStatus(id, !currentStatus);
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    } catch {
      showMessage('Error', 'Action failed', 'error');
    }
  };


  return {
    // data
    stats,
    allSuppliers,
    allResellers,
    allUsers,
    pendingProducts,
    approvedProducts,
    loading,
    // ui state
    messageModal,
    setMessageModal,
    confirmVerify,
    setConfirmVerify,
    rejectPrompt,
    setRejectPrompt,
    rejectionReasonInput,
    setRejectionReasonInput,
    // handlers
    handleVerifySupplier,
    handleVerifyReseller,
    executeVerify,
    executeReject,
    handleVerifyProduct,
    handleToggleUserStatus,
  };
};
