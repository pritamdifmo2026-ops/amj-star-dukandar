import React, { useState } from 'react';
import { Trash2, Plus, X, Tags, CheckCircle2, Edit2 } from 'lucide-react';
// removed unused import
import styles from '../pages/AdminDashboard.module.css';
import localStyles from './CategoryManagement.module.css';
import Pagination from '@/shared/components/ui/Pagination';
import categoryService from '@/features/product/services/category.service';

interface CategoryManagementProps {
  categories: any[];
  onRefresh: () => Promise<void>;
}

const CategoryManagement: React.FC<CategoryManagementProps> = ({ 
  categories, 
  onRefresh
}) => {
  const [newCategory, setNewCategory] = useState('');
  const [subcategories, setSubcategories] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Custom Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalValue, setModalValue] = useState('');
  const [modalType, setModalType] = useState<'add-sub' | 'edit-cat' | 'edit-sub' | null>(null);
  const [activeId, setActiveId] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const pagedCategories = categories.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleAddSubField = () => {
    setSubcategories([...subcategories, '']);
  };

  const handleRemoveSubField = (index: number) => {
    const newSubs = [...subcategories];
    newSubs.splice(index, 1);
    setSubcategories(newSubs);
  };

  const handleSubChange = (index: number, value: string) => {
    const newSubs = [...subcategories];
    newSubs[index] = value;
    setSubcategories(newSubs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    setLoading(true);
    try {
      const validSubs = subcategories.filter(s => s.trim() !== '');
      await categoryService.create(newCategory, undefined, validSubs);
      setNewCategory('');
      setSubcategories(['']);
      await onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category and all its subcategories?')) {
      setActionLoading(`del-cat-${id}`);
      try {
        await categoryService.delete(id);
        await onRefresh();
      } finally {
        setActionLoading(null);
      }
    }
  };

  const handleAddSubcategoryToExisting = (categoryId: string) => {
    setModalType('add-sub');
    setActiveId(categoryId);
    setModalValue('');
    setModalTitle('Add New Subcategory');
    setModalOpen(true);
  };

  const handleEditCategory = (id: string, currentName: string) => {
    setModalType('edit-cat');
    setActiveId(id);
    setModalValue(currentName);
    setModalTitle('Edit Category');
    setModalOpen(true);
  };

  const handleEditSubcategory = (subId: string, currentName: string) => {
    setModalType('edit-sub');
    setActiveId(subId);
    setModalValue(currentName);
    setModalTitle('Edit Subcategory');
    setModalOpen(true);
  };

  const handleModalSubmit = async () => {
    if (!modalValue.trim()) return;
    
    setActionLoading('modal-action');
    try {
      if (modalType === 'add-sub') {
        await categoryService.createSubcategory(activeId, modalValue.trim());
      } else if (modalType === 'edit-cat') {
        await categoryService.update(activeId, { name: modalValue.trim() });
      } else if (modalType === 'edit-sub') {
        await categoryService.updateSubcategory(activeId, { name: modalValue.trim() });
      }
      await onRefresh();
      setModalOpen(false);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteSubcategory = async (subId: string) => {
    if (window.confirm('Delete this subcategory?')) {
      setActionLoading(`del-sub-${subId}`);
      try {
        await categoryService.deleteSubcategory(subId);
        await onRefresh();
      } finally {
        setActionLoading(null);
      }
    }
  };

  return (
    <div className={styles.categoryView}>
      <form onSubmit={handleSubmit} className={localStyles.formCard}>
        <h3 className={localStyles.formHeader}>
          <div className={localStyles.iconWrapper}>
            <Tags size={20} />
          </div>
          Create New Category
        </h3>
        
        <div className={localStyles.formGrid}>
          <div className={localStyles.inputGroup}>
            <label className={localStyles.inputLabel}>
              Category Name <span className={localStyles.requiredAsterisk}>*</span>
            </label>
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="e.g. Electronics"
              required
              className={localStyles.inputField}
            />
          </div>

          <div className={localStyles.inputGroup}>
            <label className={localStyles.inputLabel}>Subcategories (Optional)</label>
            {subcategories.map((sub, idx) => (
              <div key={idx} className={localStyles.subcategoryRow}>
                <input
                  type="text"
                  value={sub}
                  onChange={(e) => handleSubChange(idx, e.target.value)}
                  placeholder="e.g. Mobile Phones"
                  className={localStyles.inputField}
                />
                {subcategories.length > 1 && (
                  <button type="button" onClick={() => handleRemoveSubField(idx)} className={localStyles.removeBtn} title="Remove subcategory">
                    <X size={18} />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={handleAddSubField} className={localStyles.addMoreBtn}>
              <Plus size={16} /> Add Subcategory
            </button>
          </div>
        </div>

        <div className={localStyles.formFooter}>
          <button type="submit" disabled={loading} className={localStyles.saveBtn}>
            {loading ? 'Saving...' : (
              <>
                <CheckCircle2 size={18} /> Save Category
              </>
            )}
          </button>
        </div>
      </form>

      <div className={styles.tableWrapper} style={{ marginTop: '32px' }}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Category</th>
              <th>Subcategories</th>
              <th style={{ width: '100px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedCategories.map(c => (
              <tr key={c._id}>
                <td data-label="Category" style={{ fontWeight: 600 }}>{c.name}</td>
                <td data-label="Subcategories">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    {(c.subcategories || []).map((sub: any) => (
                      <span key={sub._id} style={{ 
                        background: '#f3f4f6', 
                        padding: '4px 10px', 
                        borderRadius: '16px', 
                        fontSize: '13px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: '1px solid #e5e7eb'
                      }}>
                        {sub.name}
                        <div style={{ display: 'flex', gap: '4px', marginLeft: '4px' }}>
                          <button 
                            type="button" 
                            onClick={() => handleEditSubcategory(sub._id, sub.name)}
                            disabled={actionLoading === `edit-sub-${sub._id}`}
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#64748b', display: 'flex' }}
                            title="Edit subcategory"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button 
                            type="button" 
                            onClick={() => handleDeleteSubcategory(sub._id)}
                            disabled={actionLoading === `del-sub-${sub._id}`}
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#ef4444', display: 'flex' }}
                            title="Delete subcategory"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </span>
                    ))}
                    <button 
                      type="button"
                      onClick={() => handleAddSubcategoryToExisting(c._id)}
                      disabled={actionLoading === `add-sub-${c._id}`}
                      style={{ 
                        background: '#fff', 
                        border: '1px dashed #d1d5db', 
                        borderRadius: '16px', 
                        padding: '3px 10px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        color: '#6b7280',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Plus size={12} /> Add
                    </button>
                  </div>
                </td>
                <td data-label="Actions" style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button 
                      className={styles.viewBtn}
                      onClick={() => handleEditCategory(c._id, c.name)}
                      disabled={actionLoading === `edit-cat-${c._id}`}
                      aria-label="Edit category"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      className={styles.rejectBtn}
                      onClick={() => handleDeleteCategory(c._id)}
                      disabled={actionLoading === `del-cat-${c._id}`}
                      aria-label="Delete category"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr><td colSpan={3} className={styles.empty}>No categories found</td></tr>
            )}
          </tbody>
        </table>
        
        <Pagination 
          totalItems={categories.length}
          itemsPerPage={ITEMS_PER_PAGE}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          styles={styles}
        />
      </div>

      {/* Custom Modal Popup */}
      {modalOpen && (
        <div className={localStyles.modalOverlay} onClick={() => setModalOpen(false)}>
          <div className={localStyles.modalContent} onClick={e => e.stopPropagation()}>
            <h3 className={localStyles.modalHeader}>{modalTitle}</h3>
            <div className={localStyles.inputGroup}>
              <input
                type="text"
                autoFocus
                value={modalValue}
                onChange={(e) => setModalValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleModalSubmit()}
                placeholder="Enter name..."
                className={localStyles.inputField}
              />
            </div>
            <div className={localStyles.modalActions}>
              <button 
                onClick={() => setModalOpen(false)} 
                className={localStyles.cancelBtn}
                disabled={actionLoading !== null}
              >
                Cancel
              </button>
              <button 
                onClick={handleModalSubmit} 
                className={localStyles.confirmBtn}
                disabled={actionLoading !== null || !modalValue.trim()}
              >
                {actionLoading ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;