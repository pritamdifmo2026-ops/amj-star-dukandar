import React, { useState, useRef, useCallback } from 'react';
import {
  Monitor,
  Tablet,
  Smartphone,
  Upload,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2
} from 'lucide-react';
import Cropper from 'react-easy-crop';
import toast from 'react-hot-toast';
import api from '@/api/client';
import uploadService from '@/features/product/services/upload.service';
import Button from '@/shared/components/ui/Button';

export interface BannerConfig {
  desktop?: string;
  tablet?: string;
  mobile?: string;
}

export type BannerDeviceKey = 'desktop' | 'tablet' | 'mobile';

interface DeviceMeta {
  key: BannerDeviceKey;
  label: string;
  icon: React.FC<{ size?: number; className?: string }>;
  dimensions: string;
  aspectRatio: number;
  ratioLabel: string;
  viewport: string;
  description: string;
  targetWidth: number;
  targetHeight: number;
  previewHeightClass: string;
}

const DEVICES: DeviceMeta[] = [
  {
    key: 'desktop',
    label: 'Desktop Banner',
    icon: Monitor,
    dimensions: '1920 × 480 px',
    aspectRatio: 4 / 1, // 4:1
    ratioLabel: '4:1',
    viewport: '≥ 1024px',
    description: 'Displays on wide monitors, PCs, and laptops.',
    targetWidth: 1920,
    targetHeight: 480,
    previewHeightClass: 'aspect-[4/1]',
  },
  {
    key: 'tablet',
    label: 'Tablet Banner',
    icon: Tablet,
    dimensions: '1024 × 400 px',
    aspectRatio: 1024 / 400, // 2.56:1
    ratioLabel: '2.56:1',
    viewport: '640px – 1023px',
    description: 'Displays on iPads, Android tablets, and foldables.',
    targetWidth: 1024,
    targetHeight: 400,
    previewHeightClass: 'aspect-[2.56/1]',
  },
  {
    key: 'mobile',
    label: 'Mobile Banner',
    icon: Smartphone,
    dimensions: '640 × 360 px',
    aspectRatio: 16 / 9, // 1.78:1
    ratioLabel: '16:9',
    viewport: '< 640px',
    description: 'Displays on smartphones and narrow screens.',
    targetWidth: 640,
    targetHeight: 360,
    previewHeightClass: 'aspect-[16/9]',
  },
];

/* ─── Canvas Crop Function ────────────────────────────────────────── */
async function getCroppedImg(imageSrc: string, pixelCrop: any, targetW: number, targetH: number): Promise<Blob> {
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

  // Set canvas size to the exact target dimensions or high-resolution crop dimensions
  canvas.width = targetW;
  canvas.height = targetH;

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
    targetW,
    targetH
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas generated an empty blob'));
      },
      'image/jpeg',
      0.92
    );
  });
}

/* ─── Main Modal Component ───────────────────────────────────────── */
interface EditStoreBannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBanner?: BannerConfig;
  onBannerUpdated: (updatedBanner: BannerConfig) => void;
}

export const EditStoreBannerModal: React.FC<EditStoreBannerModalProps> = ({
  isOpen,
  onClose,
  initialBanner,
  onBannerUpdated,
}) => {
  const [banners, setBanners] = useState<BannerConfig>(initialBanner || {});
  const [activeDeviceKey, setActiveDeviceKey] = useState<BannerDeviceKey | null>(null);
  const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);

  // Cropper state
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deletingKey, setDeletingKey] = useState<BannerDeviceKey | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedDevice = DEVICES.find((d) => d.key === activeDeviceKey);

  // Sync initialBanner when modal opens or initialBanner updates
  React.useEffect(() => {
    if (initialBanner) {
      setBanners(initialBanner);
    }
  }, [initialBanner]);

  if (!isOpen) return null;

  const handleSelectFileClick = (deviceKey: BannerDeviceKey) => {
    setActiveDeviceKey(deviceKey);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, WEBP)');
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
    setActiveDeviceKey(null);
  };

  const handleApplyCrop = async () => {
    if (!tempImageSrc || !croppedAreaPixels || !selectedDevice) return;

    try {
      setSaving(true);
      // 1. Crop canvas to the exact target aspect ratio & dimensions
      const croppedBlob = await getCroppedImg(
        tempImageSrc,
        croppedAreaPixels,
        selectedDevice.targetWidth,
        selectedDevice.targetHeight
      );

      // 2. Upload image to Cloudinary via uploadService
      const uploadRes = await uploadService.uploadImage(croppedBlob);
      const imageUrl = uploadRes.url || uploadRes.data?.url;

      if (!imageUrl) {
        throw new Error('Image URL was not returned by the server');
      }

      // 3. Persist to backend
      await api.patch('/supplier/banner', {
        [selectedDevice.key]: imageUrl,
      });

      const updatedBanner: BannerConfig = {
        ...banners,
        [selectedDevice.key]: imageUrl,
      };

      setBanners(updatedBanner);
      onBannerUpdated(updatedBanner);
      toast.success(`${selectedDevice.label} updated successfully!`);

      // 4. Return to overview
      setTempImageSrc(null);
      setActiveDeviceKey(null);
    } catch (err: any) {
      console.error('Error saving banner:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to update banner');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBanner = async (deviceKey: BannerDeviceKey) => {
    const dev = DEVICES.find((d) => d.key === deviceKey);
    try {
      setDeletingKey(deviceKey);
      await api.patch('/supplier/banner', {
        [deviceKey]: '',
      });

      const updated = { ...banners, [deviceKey]: '' };
      setBanners(updated);
      onBannerUpdated(updated);
      toast.success(`${dev?.label || 'Device banner'} removed.`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove banner');
    } finally {
      setDeletingKey(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-[4px] p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/jpg"
        className="hidden"
        onChange={handleFileChange}
      />

      <div
        className="bg-white rounded-[20px] shadow-2xl w-full max-w-4xl border border-[#e2e8f0] overflow-hidden flex flex-col my-auto max-h-[92vh] animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-3.5 border-b border-[#f1f5f9] bg-gradient-to-r from-[#f8fafc] via-white to-[#f8fafc] shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-[#0f172a] m-0 leading-tight">
                {tempImageSrc && selectedDevice ? `Crop & Adjust ${selectedDevice.label}` : 'Store Background Banners'}
              </h2>
              {tempImageSrc && selectedDevice ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#fff7ed] text-[#e65c00] border border-[#fed7aa]">
                  {selectedDevice.dimensions} ({selectedDevice.ratioLabel})
                </span>
              ) : (
                <span className="hidden sm:inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#fff7ed] text-[#e65c00] border border-[#fed7aa]">
                  Responsive (3 Views)
                </span>
              )}
            </div>
            <p className="text-xs text-[#64748b] m-0 mt-0.5 truncate">
              {tempImageSrc && selectedDevice
                ? 'Drag to position and zoom image. Click Save Banner when satisfied.'
                : 'Upload tailored banners for Desktop, Tablet, and Mobile to look sharp on any display.'}
            </p>
          </div>

          {/* Top close button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              disabled={saving}
              className="w-8 h-8 rounded-full bg-[#f1f5f9] flex items-center justify-center text-[#64748b] hover:bg-[#e2e8f0] hover:text-[#0f172a] transition-colors border-none cursor-pointer disabled:opacity-50"
              title="Close"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* ── Modal Body ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {tempImageSrc && selectedDevice ? (
            /* ═════ STEP 2: CROPPER INTERFACE ═════ */
            <div className="flex flex-col gap-3">
              {/* Top info and zoom toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#f8fafc] border border-[#e2e8f0] px-4 py-2.5 rounded-[12px]">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#334155]">
                  <selectedDevice.icon size={16} className="text-[#e65c00]" />
                  <span>Target:</span>
                  <span className="font-extrabold text-[#0f172a] bg-white px-2 py-0.5 rounded-[6px] border border-[#e2e8f0]">
                    {selectedDevice.dimensions}
                  </span>
                  <span className="text-[11px] text-[#059669] font-bold bg-[#ecfdf5] px-2 py-0.5 rounded-[6px] border border-[#a7f3d0] hidden sm:inline-flex items-center gap-1">
                    <CheckCircle2 size={12} /> Locked {selectedDevice.ratioLabel}
                  </span>
                </div>

                {/* Zoom control inline toolbar */}
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <span className="text-xs font-semibold text-[#64748b] hidden md:inline">Zoom:</span>
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.max(1, z - 0.2))}
                    className="p-1 rounded-[6px] text-[#64748b] hover:bg-[#e2e8f0] hover:text-[#0f172a] transition-colors border border-[#cbd5e1] bg-white cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut size={14} />
                  </button>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.05}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-28 sm:w-36 accent-[#e65c00] cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
                    className="p-1 rounded-[6px] text-[#64748b] hover:bg-[#e2e8f0] hover:text-[#0f172a] transition-colors border border-[#cbd5e1] bg-white cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn size={14} />
                  </button>
                  <span className="text-xs font-mono font-bold text-[#475569] min-w-[38px] text-right">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setZoom(1);
                      setCrop({ x: 0, y: 0 });
                    }}
                    className="text-xs text-[#64748b] hover:text-[#0f172a] flex items-center gap-0.5 cursor-pointer ml-1 border-none bg-transparent"
                    title="Reset position and zoom"
                  >
                    <RotateCcw size={11} /> Reset
                  </button>
                </div>
              </div>

              {/* Crop Canvas Box (Optimized height to fit viewport without scrolling) */}
              <div className="relative w-full h-[250px] sm:h-[310px] bg-[#090d16] rounded-[14px] overflow-hidden border border-[#1e293b] shadow-inner">
                <Cropper
                  image={tempImageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={selectedDevice.aspectRatio}
                  onCropChange={setCrop}
                  onCropComplete={onCropAreaComplete}
                  onZoomChange={setZoom}
                  objectFit="contain"
                  showGrid={true}
                />
              </div>

              {/* Bottom action strip */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <span className="text-xs text-[#64748b]">
                  Adjust framing with drag and zoom, then click <strong className="text-[#0f172a]">Save Banner</strong>.
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={handleCancelCrop}
                    disabled={saving}
                    className="text-xs font-bold px-3 py-1.5 border-[#cbd5e1]"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleApplyCrop}
                    disabled={saving}
                    className="text-xs font-extrabold px-4 py-1.5 !bg-[#e65c00] hover:!bg-[#c2410c] text-white flex items-center gap-1.5 shadow-sm"
                  >
                    {saving ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={14} /> Save Banner
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* ═════ STEP 1: 3-DEVICE OVERVIEW ═════ */
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                {DEVICES.map((device) => {
                  const DeviceIcon = device.icon;
                  const currentImg = banners[device.key];
                  const isDeleting = deletingKey === device.key;

                  return (
                    <div
                      key={device.key}
                      className="bg-white rounded-[16px] border border-[#e2e8f0] hover:border-[#e65c00]/40 transition-all p-4 flex flex-col justify-between shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md group"
                    >
                      {/* Card Header with Dimension in Front */}
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-[8px] bg-[#fff7ed] text-[#e65c00] flex items-center justify-center shrink-0 border border-[#ffedd5]">
                              <DeviceIcon size={18} />
                            </div>
                            <div>
                              <h3 className="text-sm font-extrabold text-[#0f172a] m-0 leading-tight">
                                {device.label}
                              </h3>
                              <span className="text-[11px] text-[#64748b] font-medium block">
                                {device.viewport}
                              </span>
                            </div>
                          </div>

                          {currentImg && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#059669] bg-[#ecfdf5] border border-[#a7f3d0] px-2 py-0.5 rounded-full">
                              Active
                            </span>
                          )}
                        </div>

                        {/* Prominent Dimension Badge in Front */}
                        <div className="flex items-center gap-1.5 my-2.5">
                          <span className="text-xs font-black text-[#0f172a] bg-[#f1f5f9] px-2.5 py-1 rounded-[6px] border border-[#e2e8f0] font-mono tracking-tight">
                            {device.dimensions}
                          </span>
                          <span className="text-[11px] font-bold text-[#e65c00] bg-[#fff7ed] px-2 py-1 rounded-[6px] border border-[#fed7aa]">
                            {device.ratioLabel}
                          </span>
                        </div>

                        <p className="text-[11px] text-[#64748b] line-clamp-2 leading-relaxed m-0 mb-3">
                          {device.description}
                        </p>
                      </div>

                      {/* Preview Box */}
                      <div className="my-2">
                        {currentImg ? (
                          <div
                            onClick={() => handleSelectFileClick(device.key)}
                            className={`relative w-full ${device.previewHeightClass} rounded-[10px] overflow-hidden border border-[#e2e8f0] cursor-pointer bg-[#0f172a]`}
                          >
                            <img
                              src={currentImg}
                              alt={device.label}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div
                            onClick={() => handleSelectFileClick(device.key)}
                            className={`w-full ${device.previewHeightClass} rounded-[10px] border-2 border-dashed border-[#cbd5e1] hover:border-[#e65c00] bg-[#f8fafc] hover:bg-[#fff7ed]/30 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer p-3 text-center`}
                          >
                            <div className="w-8 h-8 rounded-full bg-white shadow-xs border border-[#e2e8f0] flex items-center justify-center text-[#94a3b8] group-hover:text-[#e65c00]">
                              <Upload size={15} />
                            </div>
                            <span className="text-xs font-bold text-[#475569] group-hover:text-[#e65c00]">
                              Upload {device.label.split(' ')[0]}
                            </span>
                            <span className="text-[10px] text-[#94a3b8] font-mono">
                              Exact ratio: {device.ratioLabel}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#f1f5f9]">
                        <Button
                          variant="outline"
                          onClick={() => handleSelectFileClick(device.key)}
                          className="flex-1 text-xs font-bold py-1.5 sm:py-2 flex items-center justify-center gap-1.5 hover:border-[#e65c00] hover:text-[#e65c00]"
                        >
                          <Upload size={13} />
                          {currentImg ? 'Replace' : 'Upload'}
                        </Button>

                        {currentImg && (
                          <button
                            type="button"
                            onClick={() => handleDeleteBanner(device.key)}
                            disabled={isDeleting}
                            className="p-2 rounded-[8px] text-[#ef4444] bg-[#fef2f2] hover:bg-[#fee2e2] transition-colors border border-[#fecaca] cursor-pointer disabled:opacity-50"
                            title="Remove banner"
                          >
                            {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Helpful information callout */}
              <div className="bg-[#f8fafc] rounded-[14px] border border-[#e2e8f0] p-4 flex items-start gap-3">
                <AlertCircle size={18} className="text-[#e65c00] shrink-0 mt-0.5" />
                <div className="text-xs text-[#64748b] leading-relaxed">
                  <span className="font-bold text-[#1e293b]">How Responsive Banners Work: </span>
                  When customers visit your store, the platform automatically serves the banner image tailored to
                  their device width. If you only upload a Desktop banner, it will adapt across all devices until you
                  provide dedicated Tablet and Mobile versions.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Modal Footer ── */}
        {!tempImageSrc && (
          <div className="px-6 py-3.5 bg-[#f8fafc] border-t border-[#f1f5f9] flex items-center justify-between shrink-0">
            <span className="text-xs text-[#94a3b8]">All changes apply immediately to your live store.</span>
            <Button onClick={onClose} className="text-xs sm:text-sm font-bold px-5 py-2 !bg-[#0f172a] text-white">
              Done
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditStoreBannerModal;
