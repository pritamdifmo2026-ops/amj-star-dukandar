import api from '@/api/client';

export interface AdminStats {
  totalUsers: number;
  totalSuppliers: number;
  totalResellers: number;
  pendingVerifications: number;
  pendingResellers: number;
  pendingProducts: number;
  activeUsers: number;
  totalProducts?: number;
}

const adminService = {
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data.stats;
  },

  getPendingSuppliers: async () => {
    const response = await api.get('/admin/suppliers/pending');
    return response.data.suppliers;
  },

  getAllSuppliers: async () => {
    const response = await api.get('/admin/suppliers/all');
    return response.data.suppliers;
  },

  verifySupplier: async (id: string, status: 'VERIFIED' | 'REJECTED', reason?: string) => {
    const response = await api.patch(`/admin/suppliers/${id}/verify`, { status, reason });
    return response.data.supplier;
  },

  getAllUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data.users;
  },

  toggleUserStatus: async (id: string, isActive: boolean) => {
    const response = await api.patch(`/admin/users/${id}/status`, { isActive });
    return response.data.user;
  },

  getPendingProducts: async () => {
    const response = await api.get('/admin/products/pending');
    return response.data.products;
  },
  
  getAllProducts: async () => {
    const response = await api.get('/admin/products/all');
    return response.data.products;
  },

  verifyProduct: async (id: string, status: 'APPROVED' | 'REJECTED') => {
    const response = await api.patch(`/admin/products/${id}/verify`, { status });
    return response.data.product;
  },
  
  getPendingResellers: async () => {
    const response = await api.get('/admin/resellers/pending');
    return response.data.resellers;
  },

  getAllResellers: async () => {
    const response = await api.get('/admin/resellers/all');
    return response.data.resellers;
  },

  verifyReseller: async (id: string, status: 'APPROVED' | 'REJECTED', reason?: string) => {
    const response = await api.patch(`/admin/resellers/${id}/verify`, { status, reason });
    return response.data.reseller;
  },
  
  getSupplierProducts: async (id: string) => {
    const response = await api.get(`/admin/suppliers/${id}/products`);
    return response.data.products;
  },

  getAllBanners: async () => {
    const response = await api.get('/banners');
    return response.data.data;
  },

  getActiveBanners: async () => {
    const response = await api.get('/banners/active');
    return response.data.data;
  },

  createBanner: async (data: any) => {
    const response = await api.post('/banners', data);
    return response.data.data;
  },

  updateBanner: async (id: string, data: any) => {
    const response = await api.put(`/banners/${id}`, data);
    return response.data.data;
  },

  deleteBanner: async (id: string) => {
    const response = await api.delete(`/banners/${id}`);
    return response.data;
  },

  uploadImage: async (file: File) => {
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
