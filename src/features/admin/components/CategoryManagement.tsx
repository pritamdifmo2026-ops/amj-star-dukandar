import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import Button from '@/shared/components/ui/Button';
import styles from '../pages/AdminDashboard.module.css';
import Pagination from '@/shared/components/ui/Pagination';

interface CategoryManagementProps {
  categories: any[];
  onAddCategory: (name: string) => Promise<void>;
  onDeleteCategory?: (id: string) => Promise<void>;
}

const CategoryManagement: React.FC<CategoryManagementProps> = ({ 
  categories, 
  onAddCategory,
  onDeleteCategory 
}) => {
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const pagedCategories = categories.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    setLoading(true);
    try {
      await onAddCategory(newCategory);
      setNewCategory('');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!onDeleteCategory) return;
    if (window.confirm('Are you sure you want to delete this category?')) {
      setDeletingId(id);
      try {
        await onDeleteCategory(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className={styles.categoryView}>
      <form onSubmit={handleSubmit} className={styles.categoryForm}>
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="Enter new category name (e.g. Textiles)"
          required
        />
        <Button type="submit" loading={loading}>
          Add Category
        </Button>
      </form>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Category Name</th>
              <th className={styles.slugColumn}>Slug</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedCategories.map(c => (
              <tr key={c._id}>
                <td data-label="Category Name">{c.name}</td>
                <td data-label="Slug" className={styles.slugColumn}>{c.slug}</td>
                <td data-label="Status"><span className={styles.badge}>{c.isActive ? 'Active' : 'Inactive'}</span></td>
                <td data-label="Actions">
                  <button 
                    className={styles.rejectBtn}
                    onClick={() => handleDelete(c._id)}
                    disabled={deletingId === c._id}
                    aria-label="Delete category"
                    style={{ marginLeft: 'auto' }}
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr><td colSpan={4} className={styles.empty}>No categories found</td></tr>
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
    </div>
  );
};

export default CategoryManagement;