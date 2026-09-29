import React, { useState } from 'react';
import {
  Store,
  Copy,
  CheckCircle,
  ExternalLink,
  QrCode,
  Download,
  Share2,
  MessageCircle,
  Image as ImageIcon,
  Monitor,
  Tablet,
  Smartphone,
  Sparkles,
  Gift,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';
import { QRCodeCanvas } from 'qrcode.react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setSupplierProfile } from '../store/supplier.slice';
import EditStoreBannerModal, { type BannerConfig } from './EditStoreBannerModal';
import EditStoreLogoModal from './EditStoreLogoModal';
import ShareModal from '@/shared/components/ui/ShareModal';
import { toStoreSlug } from '@/shared/utils/ogImage';
import api from '@/api/client';

interface SupplierStoreFrontProps {
  supplierId: string;
}

const SupplierStoreFront: React.FC<SupplierStoreFrontProps> = ({ supplierId }) => {
  const dispatch = useAppDispatch();
  const { profile } = useAppSelector((state) => state.supplier);
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [shareConfig, setShareConfig] = useState<{
    isOpen: boolean;
    primaryMode: 'store' | 'referral';
  }>({
    isOpen: false,
    primaryMode: 'store',
  });
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [loadingCode, setLoadingCode] = useState(false);

  const businessName = profile?.businessName || 'Store';
  const referralCode = profile?.referralCode || '';
  const storeSlug = toStoreSlug(businessName, supplierId);
  const storeLink = `${window.location.origin}/store/${storeSlug}`;
  const inviteLink = referralCode
    ? `${window.location.origin}/register?mode=buyer&ref=${referralCode}`
    : `${window.location.origin}/register?mode=buyer`;

  const getShareMessage = (code?: string) => {
    const activeCode = code || referralCode;
    const activeInvite = activeCode
      ? `${window.location.origin}/register?mode=buyer&ref=${activeCode}`
      : `${window.location.origin}/register?mode=buyer`;

    return `🌟 *Order Directly from ${businessName} on AMJSTAR!*

Browse our verified wholesale catalog, live bulk pricing, and exclusive deals.

👉 *Visit our Store:*
${storeLink}${activeCode ? `?ref=${activeCode}` : ''}

📝 *New to AMJSTAR? Sign up with my Referral Code:*
👉 ${activeInvite}
🔑 *Referral Code:* *${activeCode || '------'}*

Sign up now to connect directly with our store and place wholesale orders!`;
  };

  const ensureReferralCode = async (): Promise<string> => {
    if (referralCode) return referralCode;
    try {
      setLoadingCode(true);
      const res = await api.post('/supplier/referral-code');
      if (res.data?.referralCode) {
        dispatch(setSupplierProfile({ ...profile!, referralCode: res.data.referralCode }));
        toast.success(res.data.isNew ? 'New referral code assigned!' : 'Referral code loaded!');
        return res.data.referralCode;
      }
    } catch (err: any) {
      toast.error('Failed to get referral code');
    } finally {
      setLoadingCode(false);
    }
    return '';
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(storeLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const copyReferralCode = async () => {
    let code = referralCode;
    if (!code) {
      code = await ensureReferralCode();
    }
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      toast.success('Referral code copied!');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      toast.error('Failed to copy referral code');
    }
  };

  const copyInviteLink = async () => {
    let code = referralCode;
    if (!code) {
      code = await ensureReferralCode();
    }
    const targetLink = code
      ? `${window.location.origin}/register?mode=buyer&ref=${code}`
      : inviteLink;
    try {
      await navigator.clipboard.writeText(targetLink);
      setCopiedInvite(true);
      toast.success('Buyer registration invite link copied!');
      setTimeout(() => setCopiedInvite(false), 2000);
    } catch (err) {
      toast.error('Failed to copy invite link');
    }
  };

  const shareStoreToWhatsApp = async () => {
    let code = referralCode;
    if (!code) {
      code = await ensureReferralCode();
    }
    const storeTargetUrl = code ? `${storeLink}?ref=${code}` : storeLink;
    const activeInvite = code
      ? `${window.location.origin}/register?mode=buyer&ref=${code}`
      : inviteLink;

    const msg = `🌟 *Visit ${businessName} on AMJSTAR!*

Browse our verified wholesale catalog, live bulk pricing, and exclusive deals.

👉 *Store Catalog:*
${storeTargetUrl}

${code ? `📝 *New Buyer? Sign up with my Referral Code:*\n👉 ${activeInvite}\n🔑 *Referral Code:* *${code}*` : ''}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(msg.trim())}`, '_blank');
  };

  const shareReferralToWhatsApp = async () => {
    let code = referralCode;
    if (!code) {
      code = await ensureReferralCode();
    }
    const targetInvite = code
      ? `${window.location.origin}/register?mode=buyer&ref=${code}`
      : inviteLink;

    const msg = `🌟 *Join ${businessName} on AMJSTAR!*

Register as a verified buyer using my referral code to connect directly with our wholesale business.

📝 *Register on AMJSTAR:*
👉 ${targetInvite}

🔑 *Referral Code:* *${code || '------'}*

Sign up now to start ordering directly at wholesale pricing!`;

    window.open(`https://wa.me/?text=${encodeURIComponent(msg.trim())}`, '_blank');
  };

  const copyReferralFullMessage = async () => {
    let code = referralCode;
    if (!code) {
      code = await ensureReferralCode();
    }
    const targetInvite = code
      ? `${window.location.origin}/register?mode=buyer&ref=${code}`
      : inviteLink;

    const msg = `🌟 *Join ${businessName} on AMJSTAR!*

Register as a verified buyer using my referral code to connect directly with our wholesale business.

📝 *Register on AMJSTAR:*
👉 ${targetInvite}

🔑 *Referral Code:* *${code || '------'}*

Sign up now to start ordering directly at wholesale pricing!`;

    try {
      await navigator.clipboard.writeText(msg.trim());
      toast.success('Referral message copied! Ready to paste.');
    } catch (err) {
      toast.error('Failed to copy message');
    }
  };

  const openStorefront = () => {
    window.open(storeLink, '_blank');
  };

  const downloadQRCode = () => {
    const canvas = document.getElementById('qr-code-canvas') as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = 'store-qr-code.png';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const openStoreShareModal = async () => {
    let code = referralCode;
    if (!code) {
      code = await ensureReferralCode();
    }
    setShareConfig({
      isOpen: true,
      primaryMode: 'store',
    });
  };

  const openReferralShareModal = async () => {
    let code = referralCode;
    if (!code) {
      code = await ensureReferralCode();
    }
    setShareConfig({
      isOpen: true,
      primaryMode: 'referral',
    });
  };

  const shareNative = async () => {
    let code = referralCode;
    if (!code) {
      code = await ensureReferralCode();
    }
    const msg = getShareMessage(code);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${businessName} - Wholesale Store`,
          text: msg,
          url: storeLink,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      openStoreShareModal();
    }
  };
  const initials = businessName
    ?.split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase() || 'ST';

  const bannerConfig: BannerConfig = profile?.banner || {};

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
      <div className="bg-white rounded-[10px] border border-[#eef2f6] p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02)] max-lg:p-5 max-sm:p-4">
        <div className="flex items-center gap-3 mb-4 max-sm:items-start">
          <div className="w-12 h-12 max-sm:w-10 max-sm:h-10 bg-[#fff7ed] text-[#d97706] rounded-[10px] flex items-center justify-center shrink-0">
            <Store size={24} />
          </div>
          <div className="min-w-0">
            <h2 className="text-[1.25rem] max-sm:text-base text-[#1e293b] m-0 font-extrabold leading-tight">Your Public Storefront</h2>
            <p className="text-sm text-[#64748b] mt-1 m-0">Share your store link with customers, on Instagram, Twitter, or anywhere.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col xl:flex-row gap-3 items-stretch xl:items-center">
          <div className="flex-1 min-w-0 flex items-center gap-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-3.5 py-2.5">
            <span className="text-[#0f172a] font-medium text-sm truncate flex-1 select-all" title={storeLink}>
              {storeLink}
            </span>
            <button 
              onClick={copyToClipboard}
              className="text-[#64748b] hover:text-primary transition-colors cursor-pointer p-1.5 rounded hover:bg-[#e2e8f0]/60 shrink-0"
              title="Copy Link"
            >
              {copied ? <CheckCircle size={18} className="text-[#059669]" /> : <Copy size={18} />}
            </button>
          </div>
          <div className="flex items-center gap-2 max-xl:w-full flex-wrap sm:flex-nowrap shrink-0">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowQRModal(true)} 
              className="flex-1 sm:flex-initial min-w-[95px] flex items-center justify-center gap-1.5 whitespace-nowrap !py-2 !px-3 text-sm font-semibold rounded-[8px] !text-slate-700 !border-slate-300 hover:!bg-slate-100 hover:!text-slate-900"
            >
              <QrCode size={15} /> QR Code
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={openStoreShareModal} 
              className="flex-1 sm:flex-initial min-w-[105px] flex items-center justify-center gap-1.5 whitespace-nowrap !py-2 !px-3 text-sm font-semibold rounded-[8px] !border-primary/40 !text-primary hover:!bg-primary/10 hover:!text-primary"
            >
              <Share2 size={15} /> Share Store
            </Button>
            <Button 
              size="sm"
              onClick={openStorefront} 
              className="flex-1 sm:flex-initial min-w-[105px] flex items-center justify-center gap-1.5 whitespace-nowrap !py-2 !px-3.5 text-sm font-semibold rounded-[8px]"
            >
              <ExternalLink size={15} /> Visit Store
            </Button>
          </div>
        </div>
      </div>

      {/* ── Supplier Referral & Buyer Connect Section ────────────────────── */}
      <div className="bg-gradient-to-br from-amber-50/60 via-white to-orange-50/40 rounded-[10px] border border-amber-200/80 p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02)] max-lg:p-5 max-sm:p-4">
        <div className="flex items-center gap-3 mb-2 max-sm:items-start">
          <div className="w-12 h-12 max-sm:w-10 max-sm:h-10 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-[10px] flex items-center justify-center shrink-0 shadow-xs">
            <Gift size={24} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[1.25rem] max-sm:text-base text-[#1e293b] m-0 font-extrabold leading-tight">
                Refer Buyers & Link to Your Store
              </h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                Direct Login Redirect
              </span>
            </div>
            <p className="text-sm text-[#64748b] mt-1 m-0">
              When buyers sign up using your unique referral code or invite link, they will be automatically redirected directly to your store on every login.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Referral Code Box */}
          <div className="bg-white border border-amber-200 rounded-[10px] p-4 flex flex-col justify-between shadow-xs">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-amber-800">
                Your 6-Character Referral Code
              </span>
              <div className="mt-2 flex items-center justify-between gap-3">
                {!referralCode ? (
                  <Button
                    size="sm"
                    onClick={ensureReferralCode}
                    loading={loadingCode}
                    className="!bg-[#e65c00] hover:!bg-[#c2410c] text-white text-xs font-bold"
                  >
                    <Gift size={14} /> Get Your Referral Code
                  </Button>
                ) : (
                  <div className="text-2xl sm:text-3xl font-black font-mono tracking-widest text-[#0f172a] select-all">
                    {referralCode}
                  </div>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyReferralCode}
                  disabled={loadingCode}
                  className="shrink-0 flex items-center gap-1.5 text-xs font-bold !border-amber-300 !text-amber-800 hover:!bg-amber-100 hover:!text-amber-950"
                >
                  {copiedCode ? <CheckCircle size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  {copiedCode ? 'Copied' : 'Copy Code'}
                </Button>
              </div>
            </div>
            <p className="text-[11px] text-[#64748b] mt-3 m-0">
              Share this code for buyers to enter during registration.
            </p>
          </div>

          {/* Direct Invite Link Box */}
          <div className="bg-white border border-amber-200 rounded-[10px] p-4 flex flex-col justify-between shadow-xs">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-amber-800">
                Buyer Registration Invite Link
              </span>
              <div className="mt-2 flex items-center gap-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-3 py-1.5">
                <span className="text-xs font-mono text-[#334155] truncate flex-1 select-all" title={inviteLink}>
                  {inviteLink}
                </span>
                <button
                  type="button"
                  onClick={copyInviteLink}
                  className="text-[#64748b] hover:text-primary transition-colors cursor-pointer p-1 rounded hover:bg-slate-200 shrink-0"
                  title="Copy Invite Link"
                >
                  {copiedInvite ? <CheckCircle size={16} className="text-emerald-600" /> : <Copy size={16} />}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-[#64748b] mt-3 m-0">
              Auto-fills your referral code automatically on the registration page.
            </p>
          </div>
        </div>

        {/* Quick Social Share Actions */}
        <div className="mt-4 pt-4 border-t border-amber-200/60 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              onClick={shareReferralToWhatsApp}
              className="flex items-center gap-2 !bg-[#25D366] hover:!bg-[#128C7E] text-white font-bold text-xs !py-2 !px-4"
            >
              <MessageCircle size={15} /> Share on WhatsApp
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={copyReferralFullMessage}
              className="flex items-center gap-1.5 text-xs font-bold !border-slate-300 !text-slate-700 hover:!bg-slate-200 hover:!text-slate-900"
            >
              <Copy size={14} /> Copy Full Message
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={openReferralShareModal}
              className="flex items-center gap-1.5 text-xs font-bold !border-amber-300 !text-amber-800 hover:!bg-amber-100 hover:!text-amber-950"
            >
              <Share2 size={14} /> More Options
            </Button>
          </div>
          <span className="text-[11px] text-amber-900/70 font-medium">
            Includes code, direct links, and store summary
          </span>
        </div>
      </div>

      {/* ── Storefront Logo Card ────────────────────────────────────────── */}
      <div className="bg-white rounded-[10px] border border-[#eef2f6] p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02)] max-lg:p-5 max-sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[14px] bg-gradient-to-br from-[#fff7ed] to-[#fef3c7] border-2 border-[#fed7aa] p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
              {profile?.logo ? (
                <img
                  src={profile.logo}
                  alt={businessName}
                  className="w-full h-full object-cover rounded-[10px]"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-[#d97706]">
                  <span className="text-xl sm:text-2xl font-black">{initials}</span>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[1.25rem] max-sm:text-base text-[#1e293b] m-0 font-extrabold leading-tight">
                  Storefront Brand Logo
                </h2>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#fff7ed] text-[#e65c00] border border-[#fed7aa]">
                  <Sparkles size={11} /> 1:1 Square
                </span>
              </div>
              <p className="text-sm text-[#64748b] mt-1 m-0">
                Your brand logo represents your business on your storefront and quotes. Cropped strictly to a 1:1 square.
              </p>
            </div>
          </div>

          <Button
            onClick={() => setShowLogoModal(true)}
            className="flex items-center justify-center gap-2 shrink-0 !bg-[#e65c00] hover:!bg-[#c2410c] text-white font-bold"
          >
            <Store size={16} /> {profile?.logo ? 'Change Store Logo' : 'Upload Store Logo'}
          </Button>
        </div>
      </div>

      {/* ── Storefront Banners Card ────────────────────────────────────── */}
      <div className="bg-white rounded-[10px] border border-[#eef2f6] p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02)] max-lg:p-5 max-sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 max-sm:w-10 max-sm:h-10 bg-[#eff6ff] text-[#2563eb] rounded-[10px] flex items-center justify-center shrink-0">
              <ImageIcon size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[1.25rem] max-sm:text-base text-[#1e293b] m-0 font-extrabold leading-tight">
                  Store Background Banners
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]">
                  <Sparkles size={11} /> 3 Devices
                </span>
              </div>
              <p className="text-sm text-[#64748b] mt-1 m-0">
                Tailor separate banners for Desktop (1920×480), Tablet (1024×400), and Mobile (640×360) screens.
              </p>
            </div>
          </div>

          <Button
            onClick={() => setShowBannerModal(true)}
            className="flex items-center justify-center gap-2 shrink-0 !bg-[#e65c00] hover:!bg-[#c2410c] text-white font-bold"
          >
            <ImageIcon size={16} /> Customize Banners
          </Button>
        </div>

        {/* Mini device preview strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
          {([
            { key: 'desktop' as const, label: 'Desktop', size: '1920 × 480 px', ratio: '4:1', icon: Monitor },
            { key: 'tablet' as const, label: 'Tablet', size: '1024 × 400 px', ratio: '2.56:1', icon: Tablet },
            { key: 'mobile' as const, label: 'Mobile', size: '640 × 360 px', ratio: '16:9', icon: Smartphone },
          ]).map(({ key, label, size, ratio, icon: Icon }) => {
            const img = bannerConfig[key];
            return (
              <div
                key={key}
                onClick={() => setShowBannerModal(true)}
                className="bg-[#f8fafc] border border-[#e2e8f0] hover:border-[#e65c00]/50 rounded-[10px] p-3.5 flex flex-col justify-between gap-3 cursor-pointer transition-all hover:shadow-xs group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#1e293b]">
                    <Icon size={14} className="text-[#64748b] group-hover:text-[#e65c00] transition-colors" />
                    <span>{label}</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#e65c00] bg-[#fff7ed] px-1.5 py-0.5 rounded-[4px] border border-[#fed7aa]">
                    {ratio}
                  </span>
                </div>

                <div className="relative w-full h-20 bg-[#0f172a] rounded-[6px] overflow-hidden border border-[#e2e8f0] flex items-center justify-center">
                  {img ? (
                    <img src={img} alt={label} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[11px] text-[#94a3b8] font-medium">Default Gradient</span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#64748b]">
                  <span className="font-mono font-medium">{size}</span>
                  <span className="text-primary font-semibold group-hover:underline">Edit</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showBannerModal && (
        <EditStoreBannerModal
          isOpen={showBannerModal}
          onClose={() => setShowBannerModal(false)}
          initialBanner={bannerConfig}
          onBannerUpdated={(updated) => {
            if (profile) {
              dispatch(setSupplierProfile({ ...profile, banner: updated }));
            }
          }}
        />
      )}

      {showLogoModal && (
        <EditStoreLogoModal
          isOpen={showLogoModal}
          onClose={() => setShowLogoModal(false)}
          currentLogo={profile?.logo}
          businessName={businessName}
          onLogoUpdated={(newLogo) => {
            if (profile) {
              dispatch(setSupplierProfile({ ...profile, logo: newLogo }));
            }
          }}
        />
      )}

      <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[10px] p-6 max-sm:p-4 text-center">
        <Store size={48} className="text-[#94a3b8] mx-auto mb-4 opacity-50 max-sm:w-10 max-sm:h-10" />
        <h3 className="text-lg max-sm:text-base font-bold text-[#1e293b] mb-2">Build Trust with Buyers</h3>
        <p className="text-sm text-[#64748b] max-w-lg mx-auto leading-relaxed">
          Your public storefront displays all your approved products automatically. Buyers can view your complete catalog, learn about your business, and trust your verified profile.
        </p>
      </div>

      <Modal isOpen={showQRModal} onClose={() => setShowQRModal(false)} title="Share Store">
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white p-4 rounded-[12px] shadow-sm border border-[#eef2f6] mb-6">
            <QRCodeCanvas id="qr-code-canvas" value={storeLink} size={200} level="H" includeMargin={false} />
          </div>
          <h3 className="text-lg font-bold text-[#1e293b] mb-2">Scan to visit store</h3>
          <p className="text-sm text-[#64748b] mb-6 max-w-[280px]">
            Buyers can scan this QR code with their phone camera to instantly view your products.
          </p>

          <div className="w-full flex flex-col gap-3 mb-4">
            <Button onClick={downloadQRCode} className="w-full flex items-center justify-center gap-2">
              <Download size={16} /> Download QR Code
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={shareStoreToWhatsApp} className="w-full flex items-center justify-center gap-2 !bg-[#25D366] !text-white !border-none hover:!bg-[#128C7E] hover:!text-white">
                <MessageCircle size={16} /> WhatsApp
              </Button>
              <Button variant="outline" onClick={shareNative} className="w-full flex items-center justify-center gap-2 !text-slate-700 !border-slate-300 hover:!bg-slate-100 hover:!text-slate-900">
                <Share2 size={16} /> Share
              </Button>
            </div>
          </div>
          <Button variant="outline" onClick={() => setShowQRModal(false)} className="w-full mt-2 border-none bg-transparent hover:!bg-[#f1f5f9] hover:!text-[#0f172a] !text-[#64748b]">
            Close
          </Button>
        </div>
      </Modal>

      <ShareModal
        isOpen={shareConfig.isOpen}
        onClose={() => setShareConfig((prev) => ({ ...prev, isOpen: false }))}
        title={businessName}
        subtitle="Verified Wholesale Store on AMJSTAR"
        primaryMode={shareConfig.primaryMode}
        url={shareConfig.primaryMode === 'store' ? storeLink : inviteLink}
        storeUrl={storeLink}
        imageUrl={profile?.logo || undefined}
        referralCode={profile?.referralCode}
      />
    </div>
  );
};

export default SupplierStoreFront;
