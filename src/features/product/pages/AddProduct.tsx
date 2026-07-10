import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PackagePlus, ArrowLeft, Info } from 'lucide-react';
import { productApi } from '../services/product.api';
import ProductForm from '../components/ProductForm';
import { toast } from 'react-hot-toast';
import Navbar from '@/features/landing/components/Navbar';
import Footer from '@/features/landing/components/Footer';

const AddProduct: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await productApi.create(data);
      toast.success('Product listed successfully!');
      navigate('/products');
    } catch {
      toast.error('Failed to list product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Navbar />
      <main className="flex-1 py-8 pb-16 max-lg:pt-[calc(56px+env(safe-area-inset-top,0px))]">
        <div className="w-full max-w-[var(--width-container)] mx-auto px-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 bg-transparent border-none text-body text-sm font-medium cursor-pointer mb-6 p-0 hover:text-primary transition-colors"
          >
            <ArrowLeft size={18} /> Back
          </button>

          <header className="mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-soft rounded-[var(--radius-md)] flex items-center justify-center">
                <PackagePlus size={24} color="var(--color-primary)" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-heading">List New Product</h1>
                <p className="text-sm text-body">Add your product to the AMJSTAR Marketplace</p>
              </div>
            </div>
          </header>

          <div className="flex gap-8 items-start">
            <div className="flex-1 bg-white border border-border rounded-[var(--radius-md)] p-8">
              <ProductForm onSubmit={handleSubmit} isLoading={isSubmitting} submitLabel="Publish Product" />
            </div>

            <aside className="w-[280px] shrink-0">
              <div className="bg-white border border-border rounded-[var(--radius-md)] p-6">
                <div className="flex items-center gap-2 text-primary font-bold mb-4">
                  <Info size={16} />
                  <span>Pro Tips</span>
                </div>
                <ul className="flex flex-col gap-3 list-none p-0 m-0">
                  {[
                    'Use clear, high-resolution images for better visibility.',
                    'Provide a detailed description to build trust with buyers.',
                    'Ensure your GST rate is accurate for legal compliance.',
                    'Setting a competitive wholesale price attracts more resellers.',
                  ].map(tip => (
                    <li key={tip} className="text-sm text-body leading-relaxed pl-3 border-l-2 border-border">{tip}</li>
                  ))}
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
