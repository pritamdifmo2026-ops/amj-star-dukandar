import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PackagePlus, ArrowLeft, Info } from 'lucide-react';
import { productApi } from '../services/product.api';
import ProductForm from '../components/ProductForm';
import { toast } from 'react-hot-toast';
import Navbar from '@/features/landing/components/Navbar';
import Footer from '@/features/landing/components/Footer';
import styles from './AddProduct.module.css';

const AddProduct: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await productApi.create(data);
      toast.success('Product listed successfully!');
      navigate('/products');
    } catch (error) {
      toast.error('Failed to list product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.container}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
            Back
          </button>
          <header className={styles.header}>
            <div className={styles.titleArea}>
              <div className={styles.iconBox}>
                <PackagePlus size={24} color="var(--color-primary)" />
              </div>
              <div>
                <h1 className={styles.title}>List New Product</h1>
                <p className={styles.subtitle}>Add your product to the AMJ Star Marketplace</p>
              </div>
            </div>
          </header>
          <div className={styles.layout}>
            <div className={styles.formCard}>
              <ProductForm 
                onSubmit={handleSubmit} 
                isLoading={isSubmitting} 
                submitLabel="Publish Product" 
              />
            </div>
            <aside className={styles.sidebar}>
              <div className={styles.tipCard}>
                <div className={styles.tipTitle}>
                  <Info size={16} />
                  <span>Pro Tips</span>
                </div>
                <ul className={styles.tipList}>
                  <li>Use clear, high-resolution images for better visibility.</li>
                  <li>Provide a detailed description to build trust with buyers.</li>
                  <li>Ensure your GST rate is accurate for legal compliance.</li>
                  <li>Setting a competitive wholesale price attracts more resellers.</li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AddProduct;
