import React, { useState, useEffect } from 'react';
import adminService from '../services/admin.service';
import Button from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Upload
} from 'lucide-react';

interface Banner {
  _id: string;
  imageDesktop: string;
  imageTablet: string;
  imageMobile: string;
  link: string;
  status: boolean;
  order: number;
}

const BannerManagement: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    link: '',
    status: true,
    order: 0,
    imageDesktop: '',
    imageTablet: '',
    imageMobile: ''
  });

  const [uploading, setUploading] = useState({
    imageDesktop: false,
    imageTablet: false,
    imageMobile: false
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const data = await adminService.getAllBanners();
      setBanners(data);
    } catch (error) {
      console.error('Failed to fetch banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        link: banner.link,
        status: banner.status,
        order: banner.order,
        imageDesktop: banner.imageDesktop,
        imageTablet: banner.imageTablet,
        imageMobile: banner.imageMobile
      });
    } else {
      setEditingBanner(null);
      setFormData({
        link: '',
        status: true,
        order: banners.length,
        imageDesktop: '',
        imageTablet: '',
        imageMobile: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBanner(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: keyof typeof uploading) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(prev => ({ ...prev, [field]: true }));
    try {
      const url = await adminService.uploadImage(file);
      setFormData(prev => ({
        ...prev,
        [field]: url
      }));
    } catch (error) {
      console.error(`Failed to upload ${field}:`, error);
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
      fetchBanners();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save banner:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;
    try {
      await adminService.deleteBanner(id);
      fetchBanners();
    } catch (error) {
      console.error('Failed to delete banner:', error);
    }
  };

  if (loading) return <div>Loading Banners...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Banner Management</h3>
        <Button onClick={() => handleOpenModal()}>
          <Plus size={18} style={{ marginRight: '8px' }} />
          Add New Banner
        </Button>
      </div>

      <div className={styles.bannerList}>
        {banners.map((banner) => (
          <div key={banner._id} className={styles.bannerCard}>
            <div className={styles.bannerInfo}>
              <img src={banner.imageDesktop} className={styles.thumbnail} alt="Banner Preview" />
              <div className={styles.details}>
                <h4>Banner ID: {banner._id.slice(-6).toUpperCase()}</h4>
                <p>{banner.link || 'No link set'}</p>
                <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                  <span className={`${styles.status} ${banner.status ? styles.active : styles.inactive}`}>
                    {banner.status ? 'Active' : 'Inactive'}
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Order: {banner.order}</span>
                </div>
              </div>
            </div>
            
            <div className={styles.actions}>
              <button className={styles.actionBtn} onClick={() => handleOpenModal(banner)}>
                <Pencil size={18} />
              </button>
              <button className={`${styles.actionBtn} ${styles.delete}`} onClick={() => handleDelete(banner._id)}>
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}

        {banners.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            No banners found. Click "Add New Banner" to get started.
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingBanner ? 'Edit Banner' : 'Add New Banner'}
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button onClick={handleSubmit}>{editingBanner ? 'Update Banner' : 'Create Banner'}</Button>
          </>
        }
      >
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Link (URL)</label>
            <input 
              className={styles.input}
              type="text" 
              name="link" 
              value={formData.link} 
              onChange={handleInputChange} 
              placeholder="e.g. /products?category=Electronics"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className={styles.formGroup}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  name="status" 
                  checked={formData.status} 
                  onChange={handleInputChange}
                />
                Active Status
              </label>
            </div>
            <div className={styles.formGroup}>
              <label>Display Order</label>
              <input 
                className={styles.input}
                type="number" 
                name="order" 
                value={formData.order} 
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Responsive Images</label>
            <div className={styles.imageUploadGrid}>
              {/* Desktop Upload */}
              <div className={styles.uploadBox}>
                {formData.imageDesktop && <img src={formData.imageDesktop} className={styles.previewImage} alt="Desktop" />}
                {uploading.imageDesktop ? <span>Uploading...</span> : (
                  <>
                    <Upload size={24} color="#64748b" />
                    <span className={styles.uploadLabel}>Desktop</span>
                    <input type="file" onChange={(e) => handleImageUpload(e, 'imageDesktop')} accept="image/*" />
                  </>
                )}
              </div>

              {/* Tablet Upload */}
              <div className={styles.uploadBox}>
                {formData.imageTablet && <img src={formData.imageTablet} className={styles.previewImage} alt="Tablet" />}
                {uploading.imageTablet ? <span>Uploading...</span> : (
                  <>
                    <Upload size={24} color="#64748b" />
                    <span className={styles.uploadLabel}>Tablet</span>
                    <input type="file" onChange={(e) => handleImageUpload(e, 'imageTablet')} accept="image/*" />
                  </>
                )}
              </div>

              {/* Mobile Upload */}
              <div className={styles.uploadBox}>
                {formData.imageMobile && <img src={formData.imageMobile} className={styles.previewImage} alt="Mobile" />}
                {uploading.imageMobile ? <span>Uploading...</span> : (
                  <>
                    <Upload size={24} color="#64748b" />
                    <span className={styles.uploadLabel}>Mobile</span>
                    <input type="file" onChange={(e) => handleImageUpload(e, 'imageMobile')} accept="image/*" />
                  </>
                )}
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BannerManagement;
