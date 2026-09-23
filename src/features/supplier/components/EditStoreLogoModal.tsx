import React, { useState, useRef, useCallback } from 'react';
import {
  Upload,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  X,
  Loader2,
  Store,
  Sparkles,
} from 'lucide-react';
import Cropper from 'react-easy-crop';
import toast from 'react-hot-toast';
import api from '@/api/client';
import uploadService from '@/features/product/services/upload.service';
import Button from '@/shared/components/ui/Button';

/* ─── Canvas Crop Function (Strict 1:1 Aspect Ratio) ─────────────── */
async function getCroppedImg(imageSrc: string, pixelCrop: any, targetSize = 512): Promise<Blob> {
  const image = new Image();
  image.src = imageSrc;
  image.crossOrigin = 'anonymous';
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No 2D canvas context available');

  canvas.width = targetSize;
  canvas.height = targetSize;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    targetSize,
    targetSize
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas generated an empty blob'));
      },
      'image/png',
      1.0
    );
  });
}

/* ─── Component Props ────────────────────────────────────────────── */
interface EditStoreLogoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLogo?: string;
  businessName?: string;
  onLogoUpdated: (newLogoUrl: string) => void;
}

export const EditStoreLogoModal: React.FC<EditStoreLogoModalProps> = ({
  isOpen,
  onClose,
  currentLogo,
  businessName = 'Store',
  onLogoUpdated,
}) => {
  const [logo, setLogo] = useState<string>(currentLogo || '');
  const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);

  // Cropper state
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setLogo(currentLogo || '');
  }, [currentLogo]);

  if (!isOpen) return null;

  const handleSelectFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, WEBP, SVG)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setTempImageSrc(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
  };

  const onCropAreaComplete = useCallback((_croppedArea: any, pixelCrop: any) => {
    setCroppedAreaPixels(pixelCrop);
  }, []);

  const handleCancelCrop = () => {
    setTempImageSrc(null);
  };

  const handleApplyCrop = async () => {
    if (!tempImageSrc || !croppedAreaPixels) return;

    try {
      setSaving(true);

      // 1. Crop canvas strictly 1:1
      const croppedBlob = await getCroppedImg(tempImageSrc, croppedAreaPixels, 512);

      // 2. Upload image to Cloudinary via uploadService
      const uploadRes = await uploadService.uploadImage(croppedBlob);
      const imageUrl = uploadRes.url || uploadRes.data?.url;

      if (!imageUrl) {
        throw new Error('Image URL was not returned by the server');
      }

      // 3. Persist to backend
      await api.patch('/supplier/logo', { logo: imageUrl });

      setLogo(imageUrl);
      onLogoUpdated(imageUrl);
      toast.success('Store logo updated successfully!');

      setTempImageSrc(null);
      onClose();
    } catch (err: any) {
      console.error('Error saving logo:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to update store logo');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      setRemoving(true);
      await api.patch('/supplier/logo', { logo: '' });
      setLogo('');
      onLogoUpdated('');
      toast.success('Store logo removed.');
      onClose();
    } catch (err: any) {
      console.error('Error removing logo:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to remove logo');
    } finally {
      setRemoving(false);
    }
  };

  const initials = businessName
    ?.split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase() || 'ST';

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div
        className="bg-white rounded-[20px] w-full max-w-lg shadow-2xl border border-[#e2e8f0] overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#f1f5f9] bg-gradient-to-r from-white via-white to-[#fff7ed]/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-[#fff7ed] text-[#e65c00] flex items-center justify-center shrink-0 border border-[#fed7aa]/60">
              <Store size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-[#0f172a] m-0 leading-tight">
                  {tempImageSrc ? 'Adjust Store Logo' : 'Storefront Logo'}
                </h3>
                <span className="text-[10px] font-bold text-[#e65c00] bg-[#fff7ed] px-2 py-0.5 rounded-full border border-[#fed7aa]">
                  1:1 Square
                </span>
              </div>
              <p className="text-xs text-[#64748b] m-0 mt-0.5">
                {tempImageSrc
                  ? 'Drag and zoom to align your logo in the 1:1 frame'
                  : 'Buyers see your logo on your public storefront and quotes'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 rounded-full bg-[#f1f5f9] hover:bg-[#e2e8f0] flex items-center justify-center text-[#64748b] transition-colors cursor-pointer border-none disabled:opacity-50"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
          {tempImageSrc ? (
            /* ── CROPPER ACTIVE VIEW ───────────────────────────────── */
            <div className="flex flex-col gap-4">
              <div className="relative w-full h-[280px] sm:h-[320px] bg-slate-900 rounded-[14px] overflow-hidden border border-slate-700 shadow-inner">
                <Cropper
                  image={tempImageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="rect"
                  showGrid={true}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropAreaComplete}
                />
              </div>

              {/* Zoom & Control Bar */}
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[12px] p-3 flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs font-semibold text-[#475569]">
                  <span className="flex items-center gap-1.5">
                    <Sparkles size={13} className="text-[#e65c00]" /> Zoom &amp; Position
                  </span>
                  <button
                    onClick={() => {
                      setZoom(1);
                      setCrop({ x: 0, y: 0 });
                    }}
                    className="text-[11px] font-bold text-[#64748b] hover:text-[#e65c00] flex items-center gap-1 bg-transparent border-none cursor-pointer"
                  >
                    <RotateCcw size={11} /> Reset
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.max(1, z - 0.2))}
                    className="p-1.5 rounded-[6px] hover:bg-[#e2e8f0] text-[#64748b] cursor-pointer bg-white border border-[#cbd5e1] transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut size={15} />
                  </button>

                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.05}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="flex-1 accent-[#e65c00] cursor-pointer h-1.5 bg-[#e2e8f0] rounded-lg"
                  />

                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
                    className="p-1.5 rounded-[6px] hover:bg-[#e2e8f0] text-[#64748b] cursor-pointer bg-white border border-[#cbd5e1] transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn size={15} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-[#64748b] px-1">
                <span>Output size: <strong>512 × 512 px (1:1)</strong></span>
                <button
                  type="button"
                  onClick={handleSelectFile}
                  className="text-primary font-bold hover:underline bg-transparent border-none cursor-pointer p-0"
                >
                  Choose another file
                </button>
              </div>
            </div>
          ) : (
            /* ── OVERVIEW / PREVIEW VIEW ───────────────────────────── */
            <div className="flex flex-col items-center gap-5 text-center">
              {/* Logo Preview Container */}
              <div className="relative group">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-[20px] bg-gradient-to-br from-[#fff7ed] to-[#fef3c7] border-2 border-[#fed7aa] p-1.5 shadow-md flex items-center justify-center overflow-hidden">
                  {logo ? (
                    <img
                      src={logo}
                      alt={businessName}
                      className="w-full h-full object-cover rounded-[16px]"
                    />
                  ) : (
                    <div className="w-full h-full rounded-[16px] bg-gradient-to-br from-[#fff7ed] to-[#fef3c7] flex flex-col items-center justify-center text-[#d97706]">
                      <span className="text-3xl font-black">{initials}</span>
                      <span className="text-[10px] font-bold text-[#b45309] mt-0.5">No Logo</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSelectFile}
                  className="absolute -bottom-2 -right-2 bg-[#e65c00] hover:bg-[#c2410c] text-white p-2.5 rounded-full shadow-lg border-2 border-white transition-all hover:scale-105 cursor-pointer"
                  title="Upload image"
                >
                  <Upload size={14} />
                </button>
              </div>

              {/* Details & Info */}
              <div className="max-w-sm">
                <h4 className="text-sm font-bold text-[#0f172a] m-0">{businessName}</h4>
                <p className="text-xs text-[#64748b] m-0 mt-1 leading-relaxed">
                  Your store logo is displayed on your storefront banner card, quotation invoices, and catalog listings.
                </p>
              </div>

              {/* Requirement highlights */}
              <div className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-[12px] p-3.5 flex flex-col gap-2 text-left">
                <div className="flex items-center gap-2 text-xs text-[#334155]">
                  <CheckCircle2 size={14} className="text-[#16a34a] shrink-0" />
                  <span>Strictly <strong>1:1 aspect ratio</strong> (square)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#334155]">
                  <CheckCircle2 size={14} className="text-[#16a34a] shrink-0" />
                  <span>Recommended: <strong>512 × 512 px</strong> or higher</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#334155]">
                  <CheckCircle2 size={14} className="text-[#16a34a] shrink-0" />
                  <span>Formats: <strong>PNG, JPG, WEBP, SVG</strong> (up to 5MB)</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full flex flex-col sm:flex-row gap-2.5 mt-1">
                <Button
                  onClick={handleSelectFile}
                  className="flex-1 flex items-center justify-center gap-2 !bg-[#e65c00] hover:!bg-[#c2410c] text-white font-bold"
                >
                  <Upload size={16} /> {logo ? 'Change Logo' : 'Upload Logo'}
                </Button>

                {logo && (
                  <Button
                    variant="outline"
                    onClick={handleRemoveLogo}
                    disabled={removing}
                    className="flex items-center justify-center gap-1.5 text-[#dc2626] border-[#fecaca] hover:bg-[#fef2f2] font-semibold"
                  >
                    {removing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    <span>Remove</span>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer (When Cropping) */}
        {tempImageSrc && (
          <div className="px-6 py-4 border-t border-[#f1f5f9] bg-[#f8fafc] flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={handleCancelCrop}
              disabled={saving}
              className="text-[#64748b] border-[#cbd5e1] hover:bg-white"
            >
              Cancel
            </Button>

            <Button
              onClick={handleApplyCrop}
              disabled={saving}
              className="flex items-center justify-center gap-2 !bg-[#e65c00] hover:!bg-[#c2410c] text-white font-bold px-6 shadow-sm"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving Logo...</span>
                </>
              ) : (
                <span>Save Store Logo</span>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditStoreLogoModal;
