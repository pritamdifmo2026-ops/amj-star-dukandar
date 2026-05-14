import api from '@/api/client';
import type {
  AdminStats, AdminSupplier, AdminReseller,
  AdminProduct, AdminUser, Banner, Enquiry
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

  verifyProduct: async (id: string, status: 'APPROVED' | 'REJECTED'): Promise<AdminProduct> => {
    const response = await api.patch(`/admin/products/${id}/verify`, { status });
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

  submitEnquiry: async (data: { name: string; phone: string; email: string; message: string }) => {
    const response = await api.post('/enquiry', data);
    return response.data;
  },

  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.url;
  }
};

export default adminService;
