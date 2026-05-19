import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import adminService from '../services/admin.service';
import type { Banner } from '../types/admin.types';
import { compressImage } from '@/shared/utils/compressImage';

type BannerFormData = {
  link: string;
  status: boolean;
  order: number;
  imageDesktop: string;
  imageTablet: string;
  imageMobile: string;
};

const DEFAULT_FORM: BannerFormData = {
  link: '', status: true, order: 0,
  imageDesktop: '', imageTablet: '', imageMobile: ''
};

export const useBannerManagement = () => {
  const queryClient = useQueryClient();

  // ── Server state via React Query ───────────────────────────────────
  const { data: banners = [], isLoading: loading } = useQuery<Banner[]>({
    queryKey: ['admin', 'banners'],
    queryFn: () => adminService.getAllBanners(),
  });

  // ── UI state ───────────────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState<BannerFormData>(DEFAULT_FORM);
  const [uploading, setUploading] = useState({
    imageDesktop: false, imageTablet: false, imageMobile: false
  });

  // ── Handlers ───────────────────────────────────────────────────────
  const handleOpenModal = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        link: banner.link,
        status: banner.status,
        order: banner.order,
        imageDesktop: banner.imageDesktop,
        imageTablet: banner.imageTablet,
        imageMobile: banner.imageMobile,
      });
    } else {
      setEditingBanner(null);
      setFormData({ ...DEFAULT_FORM, order: banners.length });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof typeof uploading
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset so the same file can be picked again later
    e.target.value = '';
    // Show instant local preview while upload is in progress
    const localUrl = URL.createObjectURL(file);
    setFormData(prev => ({ ...prev, [field]: localUrl }));
    setUploading(prev => ({ ...prev, [field]: true }));
    try {
      const compressed = await compressImage(file, 1920, 0.82);
      const url = await adminService.uploadImage(compressed);
      URL.revokeObjectURL(localUrl);
      setFormData(prev => ({ ...prev, [field]: url }));
    } catch (error) {
      console.error(`Failed to upload ${field}:`, error);
      // Revert to empty on failure
      setFormData(prev => ({ ...prev, [field]: '' }));
    } finally {
      setUploading(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBanner) {
        await adminService.updateBanner(editingBanner._id, formData);
      } else {
        await adminService.createBanner(formData);
      }
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save banner:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;
    try {
      await adminService.deleteBanner(id);
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
    } catch (error) {
      console.error('Failed to delete banner:', error);
    }
  };

  return {
    banners,
    loading,
    isModalOpen,
    editingBanner,
    formData,
    uploading,
    handleOpenModal,
    handleCloseModal,
    handleInputChange,
    handleImageUpload,
    handleSubmit,
    handleDelete,
  };
};
