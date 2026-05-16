import React from 'react';
import Button from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';
import { Plus, Pencil, Trash2, Upload, Camera } from 'lucide-react';
import { useBannerManagement } from '../hooks/useBannerManagement';

const inputCls = "w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 text-sm text-[#1e293b] outline-none focus:border-primary transition-colors";

const BannerManagement: React.FC = () => {
  const {
    banners, loading,
    isModalOpen, editingBanner, formData, uploading,
    handleOpenModal, handleCloseModal,
    handleInputChange, handleImageUpload,
    handleSubmit, handleDelete,
  } = useBannerManagement();

  if (loading) return <div className="py-8 text-center text-sm text-[#64748b]">Loading Banners...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-extrabold text-[#0f172a] m-0">Banner Management</h3>
        <Button onClick={() => handleOpenModal()}>
          <Plus size={18} className="mr-2" /> Add New Banner
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {banners.map(banner => (
          <div key={banner._id} className="bg-white border border-[#eef2f6] rounded-[10px] p-4 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-4">
              {banner.imageDesktop && (
                <img src={banner.imageDesktop} className="w-20 h-12 object-cover rounded-[6px] border border-[#eef2f6]" alt="Banner Preview" />
              )}
              <div>
                <h4 className="text-sm font-bold text-[#0f172a] m-0 mb-1">Banner ID: {banner._id.slice(-6).toUpperCase()}</h4>
                <p className="text-xs text-[#64748b] m-0 mb-2">{banner.link || 'No link set'}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${banner.status ? 'bg-[#ecfdf5] text-[#059669]' : 'bg-[#f1f5f9] text-[#64748b]'}`}>
                    {banner.status ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-xs text-[#64748b]">Order: {banner.order}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-9 h-9 rounded-[8px] border border-[#e2e8f0] flex items-center justify-center text-[#475569] cursor-pointer hover:bg-[#f8fafc] bg-white" onClick={() => handleOpenModal(banner)}>
                <Pencil size={16} />
              </button>
              <button className="w-9 h-9 rounded-[8px] border border-[#fecaca] flex items-center justify-center text-[#dc2626] cursor-pointer hover:bg-[#fef2f2] bg-white" onClick={() => handleDelete(banner._id)}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {banners.length === 0 && (
          <div className="text-center py-10 text-sm text-[#64748b]">No banners found. Click "Add New Banner" to get started.</div>
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
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Link (URL)</label>
            <input className={inputCls} type="text" name="link" value={formData.link} onChange={handleInputChange} placeholder="e.g. /products?category=Electronics" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-[#334155]">
              <input type="checkbox" name="status" checked={formData.status} onChange={handleInputChange} className="w-4 h-4 accent-primary" />
              Active Status
            </label>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Display Order</label>
              <input className={inputCls} type="number" name="order" value={formData.order} onChange={handleInputChange} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Responsive Images</label>
            <div className="grid grid-cols-3 gap-3">
              {([
                { field: 'imageDesktop', label: 'Desktop', size: '1920 × 560px', viewport: '≥ 1024px' },
                { field: 'imageTablet',  label: 'Tablet',  size: '1024 × 440px', viewport: '640–1023px' },
                { field: 'imageMobile',  label: 'Mobile',  size: '640 × 320px',  viewport: '< 640px' },
              ] as const).map(({ field, label, size, viewport }) => (
                <div key={field} className="flex flex-col gap-1">
                  <label className="relative border-2 border-dashed border-[#e2e8f0] rounded-[8px] aspect-[16/9] flex flex-col items-center justify-center cursor-pointer overflow-hidden hover:border-primary transition-colors group/img">
                    {formData[field] ? (
                      <>
                        <img src={formData[field]} className="w-full h-full object-cover absolute inset-0" alt={field} />
                        {uploading[field] ? (
                          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10">
                            <span className="text-xs text-white font-semibold">Uploading...</span>
                          </div>
                        ) : (
                          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity z-10">
                            <Camera size={18} color="white" />
                            <span className="text-[10px] text-white mt-1 font-semibold">Change</span>
                          </div>
                        )}
                      </>
                    ) : uploading[field] ? (
                      <span className="text-xs text-[#64748b]">Uploading...</span>
                    ) : (
                      <>
                        <Upload size={20} color="#94a3b8" />
                        <span className="text-[10px] text-[#64748b] mt-1 font-semibold">{label}</span>
                      </>
                    )}
                    <input type="file" onChange={e => handleImageUpload(e, field)} accept="image/*" className="hidden" />
                  </label>
                  <div className="text-center">
                    <p className="text-[11px] font-bold text-[#475569] m-0">{size}</p>
                    <p className="text-[10px] text-[#94a3b8] m-0">{viewport}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BannerManagement;
