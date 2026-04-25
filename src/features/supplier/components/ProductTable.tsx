import React from 'react';
import { Package, Edit2, Trash2 } from 'lucide-react';
import Button from '@/shared/components/ui/Button';
import styles from '../pages/SupplierDashboard.module.css';

interface ProductTableProps {
  products: any[];
  loading: boolean;
  onEdit: (product: any) => void;
  onDelete: (product: any) => void;
  onAdd: () => void;
}

const ProductTable: React.FC<ProductTableProps> = ({ products, loading, onEdit, onDelete, onAdd }) => {
  if (loading) return <p>Loading products...</p>;
  
  if (products.length === 0) {
    return (
      <div className={styles.emptyProducts}>
        <Package size={48} />
        <p>No products added yet.</p>
        <Button variant="outline" onClick={onAdd}>Add your first product</Button>
      </div>
    );
  }

  return (
    <div className={styles.productTableWrapper}>
      <table className={styles.productTable}>
        <thead>
          <tr>
            <th>Product</th>
            <th>Price</th>
            <th>MOQ</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product._id}>
              <td>
                <div className={styles.productCell}>
                  {product.images && product.images.length > 0 ? (
                    <img src={product.images[0]} alt={product.name} className={styles.productThumbnail} />
                  ) : (
                    <div className={styles.productImgPlaceholder} />
                  )}
                  <span>{product.name}</span>
                </div>
              </td>
              <td>₹{product.basePrice}</td>
              <td>{product.moq} {product.unit}</td>
              <td>
                <span className={`${styles.statusBadge} ${styles[product.status.toLowerCase()]}`}>
                  {product.status}
                </span>
              </td>
              <td>
                <div className={styles.actionsCell}>
                  <button
                    className={`${styles.actionBtn} ${styles.editBtn}`}
                    onClick={() => onEdit(product)}
                    title="Edit Product"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                    onClick={() => onDelete(product)}
                    title="Delete Product"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductTable;
