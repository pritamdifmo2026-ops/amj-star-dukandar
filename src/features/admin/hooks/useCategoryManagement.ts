import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import categoryService from '@/features/product/services/category.service';
import type { Category } from '../types/admin.types';

export const useCategoryManagement = () => {
  const queryClient = useQueryClient();

  // ── Server state via React Query ───────────────────────────────────
  const { data: categories = [], isLoading: loading } = useQuery<Category[]>({
    queryKey: ['admin', 'categories'],
    queryFn: async () => {
      const data = await categoryService.getAll();
      return data.categories;
    },
  });

  // ── UI state ───────────────────────────────────────────────────────
  const [newCategory, setNewCategory] = useState('');
  const [subcategories, setSubcategories] = useState<string[]>(['']);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalValue, setModalValue] = useState('');
  const [modalType, setModalType] = useState<'add-sub' | 'edit-cat' | 'edit-sub' | null>(null);
  const [activeId, setActiveId] = useState('');

  // ── Handlers ───────────────────────────────────────────────────────
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    setIsSaving(true);
    try {
      const validSubs = subcategories.filter(s => s.trim() !== '');
      await categoryService.create(newCategory, undefined, validSubs);
      setNewCategory('');
      setSubcategories(['']);
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
    } catch (error) {
      console.error('Failed to create category:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category and all its subcategories?')) return;
    setLoadingAction(`del-cat-${id}`);
    try {
      await categoryService.delete(id);
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
    } catch (error) {
      console.error('Failed to delete category:', error);
    } finally {
      setLoadingAction(null);
    }
  };

  const openModal = (type: typeof modalType, id: string, value: string, title: string) => {
    setModalType(type);
    setActiveId(id);
    setModalValue(value);
    setModalTitle(title);
    setModalOpen(true);
  };

  const handleModalSubmit = async () => {
    if (!modalValue.trim()) return;
    setLoadingAction('modal-action');
    try {
      if (modalType === 'add-sub') {
        await categoryService.createSubcategory(activeId, modalValue.trim());
      } else if (modalType === 'edit-cat') {
        await categoryService.update(activeId, { name: modalValue.trim() });
      } else if (modalType === 'edit-sub') {
        await categoryService.updateSubcategory(activeId, { name: modalValue.trim() });
      }
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      setModalOpen(false);
    } catch (error) {
      console.error('Modal action failed:', error);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDeleteSubcategory = async (subId: string) => {
    if (!window.confirm('Delete this subcategory?')) return;
    setLoadingAction(`del-sub-${subId}`);
    try {
      await categoryService.deleteSubcategory(subId);
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
    } catch (error) {
      console.error('Failed to delete subcategory:', error);
    } finally {
      setLoadingAction(null);
    }
  };

  const refetchCategories = () => queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });

  return {
    categories,
    loading,
    newCategory,
    setNewCategory,
    subcategories,
    setSubcategories,
    isSaving,
    loadingAction,
    modalOpen,
    setModalOpen,
    modalTitle,
    modalValue,
    setModalValue,
    handleCreateCategory,
    handleDeleteCategory,
    openModal,
    handleModalSubmit,
    handleDeleteSubcategory,
    refetchCategories,
  };
};
