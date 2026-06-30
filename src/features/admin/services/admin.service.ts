import api from '@/api/client';
import type {
  AdminStats, AdminSupplier, AdminReseller,
  AdminProduct, AdminUser, Banner, Enquiry, SubAdmin
} from '../types/admin.types';

const adminService = {
  getStats: async (): Promise<AdminStats> => {
    const response = await api.get('/admin/stats');
    return response.data.stats;
  },

  getPendingSuppliers: async (): Promise<AdminSupplier[]> => {
    const response = await api.get('/admin/suppliers/pending');
    return response.data.suppliers;
  },

  getAllSuppliers: async (): Promise<AdminSupplier[]> => {
    const response = await api.get('/admin/suppliers/all');
    return response.data.suppliers;
  },

  verifySupplier: async (id: string, status: 'VERIFIED' | 'REJECTED', reason?: string): Promise<AdminSupplier> => {
    const response = await api.patch(`/admin/suppliers/${id}/verify`, { status, reason });
    return response.data.supplier;
  },

  getAllUsers: async (): Promise<AdminUser[]> => {
    const response = await api.get('/admin/users');
    return response.data.users;
  },

  toggleUserStatus: async (id: string, isActive: boolean): Promise<AdminUser> => {
    const response = await api.patch(`/admin/users/${id}/status`, { isActive });
    return response.data.user;
  },

  getPendingProducts: async (): Promise<AdminProduct[]> => {
    const response = await api.get('/admin/products/pending');
    return response.data.products;
  },
  
  getAllProducts: async (): Promise<AdminProduct[]> => {
    const response = await api.get('/admin/products/all');
    return response.data.products;
  },

  verifyProduct: async (id: string, status: 'APPROVED' | 'REJECTED', reason?: string): Promise<AdminProduct> => {
    const response = await api.patch(`/admin/products/${id}/verify`, { status, reason });
    return response.data.product;
  },
  
  getPendingResellers: async (): Promise<AdminReseller[]> => {
    const response = await api.get('/admin/resellers/pending');
    return response.data.resellers;
  },

  getAllResellers: async (): Promise<AdminReseller[]> => {
    const response = await api.get('/admin/resellers/all');
    return response.data.resellers;
  },

  verifyReseller: async (id: string, status: 'APPROVED' | 'REJECTED', reason?: string): Promise<AdminReseller> => {
    const response = await api.patch(`/admin/resellers/${id}/verify`, { status, reason });
    return response.data.reseller;
  },
  
  getSupplierProducts: async (id: string): Promise<AdminProduct[]> => {
    const response = await api.get(`/admin/suppliers/${id}/products`);
    return response.data.products;
  },

  getAllBanners: async (): Promise<Banner[]> => {
    const response = await api.get('/banners');
    return response.data.data;
  },

  getActiveBanners: async (): Promise<Banner[]> => {
    const response = await api.get('/banners/active');
    return response.data.data;
  },

  createBanner: async (data: Partial<Banner>): Promise<Banner> => {
    const response = await api.post('/banners', data);
    return response.data.data;
  },

  updateBanner: async (id: string, data: Partial<Banner>): Promise<Banner> => {
    const response = await api.put(`/banners/${id}`, data);
    return response.data.data;
  },

  deleteBanner: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/banners/${id}`);
    return response.data;
  },

  getEnquiries: async (): Promise<Enquiry[]> => {
    const response = await api.get('/enquiry');
    return response.data.enquiries;
  },

  getEnquiryNewCount: async (): Promise<number> => {
    const response = await api.get('/enquiry/count/new');
    return response.data.count;
  },

  markEnquiryRead: async (id: string): Promise<Enquiry> => {
    const response = await api.patch(`/enquiry/${id}/read`);
    return response.data.enquiry;
  },

  replyToEnquiry: async (id: string, subject: string, body: string): Promise<Enquiry> => {
    const response = await api.post(`/enquiry/${id}/reply`, { subject, body });
    return response.data.enquiry;
  },

  submitEnquiry: async (data: { name: string; phone: string; email: string; message: string; userRole?: string }) => {
    const response = await api.post('/enquiry', data);
    return response.data;
  },

  getEarnings: async () => {
    const response = await api.get('/admin/earnings');
    return response.data as { rows: any[]; totals: { totalCommissionEarned: number; totalFrozen: number; totalSupplierEarned: number; totalListingFeesEarned: number; totalAmjEarned: number } };
  },

  setCommissionRate: async (supplierId: string, commissionRate: number) => {
    const response = await api.patch(`/admin/suppliers/${supplierId}/commission-rate`, { commissionRate });
    return response.data.supplier;
  },

  getFrozenOrders: async (userId: string) => {
    const response = await api.get(`/admin/suppliers/${userId}/frozen-orders`);
    return response.data.orders as Array<{
      orderId: string;
      orderNumber: string;
      status: string;
      totalAmount: number;
      frozenAmount: number;
      buyerName: string;
      itemName: string;
      createdAt: string;
    }>;
  },

  unfreezeCommission: async (orderId: string, reason: string) => {
    const response = await api.post(`/admin/orders/${orderId}/unfreeze`, { reason });
    return response.data;
  },

  // ── Disputes ──
  getDisputes: async (status?: string) => {
    const response = await api.get('/admin/disputes', { params: status ? { status } : {} });
    return response.data.disputes as any[];
  },

  validateDispute: async (id: string) => {
    const response = await api.patch(`/admin/disputes/${id}/validate`);
    return response.data;
  },

  rejectDispute: async (id: string, reason: string) => {
    const response = await api.patch(`/admin/disputes/${id}/reject`, { reason });
    return response.data;
  },

  setAutoLiveProducts: async (supplierId: string, autoLiveProducts: boolean) => {
    const response = await api.patch(`/admin/suppliers/${supplierId}/auto-live`, { autoLiveProducts });
    return response.data.supplier;
  },

  getPlatformSettings: async () => {
    const response = await api.get('/admin/platform-settings');
    return response.data.settings;
  },

  updatePlatformSettings: async (data: { minimumWalletBalance?: number; minimumWithdrawalAmount?: number; contactPhone?: string }) => {
    const response = await api.put('/admin/platform-settings', data);
    return response.data.settings;
  },

  getWithdrawals: async (status?: string) => {
    const params = status ? { status } : {};
    const response = await api.get('/admin/withdrawals', { params });
    return response.data.withdrawals;
  },

  processWithdrawal: async (id: string, action: 'approve' | 'reject' | 'complete', adminNote?: string, transactionId?: string) => {
    const response = await api.patch(`/admin/withdrawals/${id}/process`, { action, adminNote, transactionId });
    return response.data.withdrawal;
  },

  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });
    return response.data.url;
  },

  // ─── Sub-Admin Management ────────────────────────────────────────────────
  getSubAdmins: async (): Promise<SubAdmin[]> => {
    const response = await api.get('/admin/sub-admins');
    return response.data.subAdmins;
  },

  inviteSubAdmin: async (data: { email: string; adminRoleLabel: string; permissions: string[] }): Promise<SubAdmin> => {
    const response = await api.post('/admin/sub-admins', data);
    return response.data.subAdmin;
  },

  updateSubAdmin: async (id: string, data: { adminRoleLabel?: string; permissions?: string[]; isActive?: boolean }): Promise<SubAdmin> => {
    const response = await api.patch(`/admin/sub-admins/${id}`, data);
    return response.data.subAdmin;
  },

  deleteSubAdmin: async (id: string): Promise<void> => {
    await api.delete(`/admin/sub-admins/${id}`);
  },

  changeAdminPassword: async (newPassword: string): Promise<void> => {
    await api.post('/admin/change-password', { newPassword });
  },

  // ─── Dedicated Ticket System ──────────────────────────────────────────────
  submitTicket: async (data: {
    buyerName: string;
    buyerEmail?: string;
    phone: string;
    subject: string;
    issueType: string;
    message: string;
    priority?: string;
    attachmentUrl?: string;
  }) => {
    const response = await api.post('/tickets/create', data);
    return response.data.ticket;
  },

  getTickets: async (): Promise<any[]> => {
    const response = await api.get('/tickets');
    return response.data.tickets;
  },

  replyToTicket: async (id: string, message: string, sendEmail: boolean = false, subject?: string): Promise<any> => {
    const response = await api.post(`/tickets/${id}/reply`, { message, sendEmail, subject });
    return response.data; // returns { success, ticket, emailSent, emailError }
  },

  updateTicketStatus: async (id: string, status: string): Promise<any> => {
    const response = await api.patch(`/tickets/${id}/status`, { status });
    return response.data.ticket;
  }
};

export default adminService;
