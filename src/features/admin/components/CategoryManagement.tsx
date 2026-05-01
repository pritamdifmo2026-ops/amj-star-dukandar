import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import Button from '@/shared/components/ui/Button';
import styles from '../pages/AdminDashboard.module.css';

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
            {categories.map(c => (
              <tr key={c._id}>
                <td>{c.name}</td>
                <td className={styles.slugColumn}>{c.slug}</td>
                <td><span className={styles.badge}>{c.isActive ? 'Active' : 'Inactive'}</span></td>
                <td>
                  <button 
                    className={styles.rejectBtn}
                    onClick={() => handleDelete(c._id)}
                    disabled={deletingId === c._id}
                    aria-label="Delete category"
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
      </div>
    </div>
  );
};

export default CategoryManagement;