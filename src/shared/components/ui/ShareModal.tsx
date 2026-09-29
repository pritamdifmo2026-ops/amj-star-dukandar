import React, { useState } from 'react';
import {
  MessageCircle, Send, Facebook, Linkedin, Twitter, Instagram,
  Copy, Check, Share2, Store
} from 'lucide-react';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import { toast } from 'react-hot-toast';
import {
  shareToWhatsApp,
  shareToTelegram,
  shareToFacebook,
  shareToLinkedIn,
  shareToTwitter
} from '@/shared/utils/ogImage';

export interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  text?: string;
  url: string;
  /** Optional: Secondary store browse URL */
  storeUrl?: string;
  /** Backend OG proxy URL for WhatsApp/Telegram preview */
  ogProxyUrl?: string;
  imageUrl?: string | null;
  subtitle?: string;
  referralCode?: string;
  /**
   * 'store': Store link is primary (top), Referral Registration link is secondary (bottom)
   * 'referral': Referral Registration link is primary (top), Store link is secondary (bottom)
   */
  primaryMode?: 'store' | 'referral';
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  title,
  text,
  url,
  storeUrl,
  ogProxyUrl,
  imageUrl,
  subtitle,
  referralCode,
  primaryMode,
}) => {
  const [copiedPrimary, setCopiedPrimary] = useState(false);
  const [copiedSecondary, setCopiedSecondary] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Resolve invite URL
  const registerInviteUrl = referralCode
    ? (typeof window !== 'undefined'
        ? `${window.location.origin}/register?mode=buyer&ref=${referralCode}`
        : `https://amjstar.com/register?mode=buyer&ref=${referralCode}`)
    : (!url.includes('/store/') ? url : '');

  // Resolve store URL
  const resolvedStoreUrl = storeUrl || (url.includes('/store/') ? url : '');

  // Determine mode: 'store' | 'referral' | 'generic'
  const mode: 'store' | 'referral' | 'generic' = primaryMode
    ? primaryMode
    : (url.includes('/store/') || storeUrl)
    ? 'store'
    : referralCode
    ? 'referral'
    : 'generic';

  // Configure Primary & Secondary links based on mode
  let primaryUrl = url;
  let primaryLabel = 'Share Link';
  let primaryButtonLabel = 'Copy Link';
  let secondaryUrl = storeUrl || '';
  let secondaryLabel = 'Store Catalog Link';
  let secondaryButtonLabel = 'Copy Store Link';

  if (mode === 'store') {
    primaryUrl = resolvedStoreUrl || url;
    primaryLabel = 'Store Catalog Link';
    primaryButtonLabel = 'Copy Store Link';

    secondaryUrl = registerInviteUrl;
    secondaryLabel = 'Buyer Registration Invite Link (pre-fills referral code)';
    secondaryButtonLabel = 'Copy Invite Link';
  } else if (mode === 'referral') {
    // When sharing referral: ONLY show the referral link, no store link
    primaryUrl = registerInviteUrl || url;
    primaryLabel = 'Buyer Registration Invite Link (pre-fills referral code)';
    primaryButtonLabel = 'Copy Invite Link';

    secondaryUrl = '';
    secondaryLabel = '';
    secondaryButtonLabel = '';
  }

  // Construct non-duplicated social share message
  let formattedShareText = '';
  let shareTargetUrl = primaryUrl;

  if (mode === 'store') {
    shareTargetUrl = referralCode
      ? `${primaryUrl}${primaryUrl.includes('?') ? '&' : '?'}ref=${referralCode}`
      : primaryUrl;

    const lines: string[] = [
      `🌟 *Order Directly from ${title} on AMJSTAR!*`,
      `Browse our verified wholesale catalog, live bulk pricing, and exclusive deals.`,
      `👉 *Visit our Store:*\n${shareTargetUrl}`,
    ];
    if (referralCode && registerInviteUrl) {
      lines.push(
        `📝 *New to AMJSTAR? Sign up with my Referral Code:*\n👉 ${registerInviteUrl}\n🔑 *Referral Code:* *${referralCode}*`
      );
    }
    formattedShareText = lines.join('\n\n');
  } else if (mode === 'referral') {
    shareTargetUrl = registerInviteUrl || url;
    const lines: string[] = [
      `🌟 *Join ${title} on AMJSTAR!*`,
      `Register as a verified buyer using my referral code to connect directly with our wholesale business.`,
      `📝 *Register on AMJSTAR:*\n👉 ${shareTargetUrl}`,
    ];
    if (referralCode) {
      lines.push(`🔑 *Referral Code:* *${referralCode}*`);
    }
    lines.push(`Sign up now to start ordering directly at wholesale pricing!`);
    formattedShareText = lines.join('\n\n');
  } else {
    // Generic fallback (e.g. product share)
    formattedShareText = text || '';
  }

  const handleCopyPrimary = async () => {
    try {
      await navigator.clipboard.writeText(primaryUrl);
      setCopiedPrimary(true);
      toast.success(`${primaryLabel} copied!`);
      setTimeout(() => setCopiedPrimary(false), 2500);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleCopySecondary = async () => {
    if (!secondaryUrl) return;
    try {
      await navigator.clipboard.writeText(secondaryUrl);
      setCopiedSecondary(true);
      toast.success(`${secondaryLabel} copied!`);
      setTimeout(() => setCopiedSecondary(false), 2500);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleCopyCode = async () => {
    if (!referralCode) return;
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopiedCode(true);
      toast.success('Referral code copied!');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      toast.error('Failed to copy code');
    }
  };

  const handleInstagram = async () => {
    await handleCopyPrimary();
    toast.success('Link copied! Open Instagram to paste in your story, bio, or DM.', { duration: 4000 });
    window.open('https://instagram.com', '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: formattedShareText || title,
        });
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          handleCopyPrimary();
        }
      }
    } else {
      handleCopyPrimary();
    }
  };

  const botUrl = ogProxyUrl || shareTargetUrl;
  const botShareDetails = { title, text: formattedShareText, url: botUrl };
  const shareDetails = { title, text: formattedShareText, url: shareTargetUrl };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share">
      <div className="flex flex-col gap-5 pt-1">
        {/* Preview Card */}
        <div className="flex items-center gap-3 p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-[12px] overflow-hidden">
          <div className="w-16 h-16 rounded-[8px] bg-white border border-[#e2e8f0] overflow-hidden shrink-0 flex items-center justify-center">
            {imageUrl && !imgError ? (
              <img
                src={imageUrl}
                alt={title}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#fff7ed] to-[#fef3c7] flex flex-col items-center justify-center text-[#d97706] p-1 text-center select-none">
                <Store size={22} className="text-[#d97706] mb-0.5" />
                <span className="text-[11px] font-black tracking-wider leading-none">
                  {title?.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || 'ST'}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-[#0f172a] truncate m-0">{title}</h4>
            {subtitle && <p className="text-xs font-semibold text-primary truncate mt-0.5 m-0">{subtitle}</p>}
            {text && mode === 'generic' && <p className="text-xs text-[#64748b] line-clamp-1 mt-0.5 m-0">{text}</p>}
            {referralCode && (
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[11px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded font-mono tracking-wider">
                  Code: {referralCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="text-[10px] text-amber-800 hover:!text-amber-950 underline bg-transparent border-none cursor-pointer font-medium"
                >
                  {copiedCode ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Social Share Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {/* WhatsApp */}
          <button
            onClick={() => shareToWhatsApp(botShareDetails)}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-[12px] bg-[#f0fdf4] hover:bg-[#dcfce7] border border-[#bbf7d0] text-[#15803d] transition-all cursor-pointer group"
            title="Share to WhatsApp"
          >
            <div className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <MessageCircle size={20} />
            </div>
            <span className="text-[11px] font-bold">WhatsApp</span>
          </button>

          {/* Telegram */}
          <button
            onClick={() => shareToTelegram(botShareDetails)}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-[12px] bg-[#f0f9ff] hover:bg-[#e0f2fe] border border-[#bae6fd] text-[#0369a1] transition-all cursor-pointer group"
            title="Share to Telegram"
          >
            <div className="w-10 h-10 rounded-full bg-[#0088cc] text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Send size={18} className="translate-x-[-1px] translate-y-[1px]" />
            </div>
            <span className="text-[11px] font-bold">Telegram</span>
          </button>

          {/* Facebook */}
          <button
            onClick={() => shareToFacebook(shareDetails)}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-[12px] bg-[#eff6ff] hover:bg-[#dbeafe] border border-[#bfdbfe] text-[#1d4ed8] transition-all cursor-pointer group"
            title="Share to Facebook"
          >
            <div className="w-10 h-10 rounded-full bg-[#1877F2] text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Facebook size={19} />
            </div>
            <span className="text-[11px] font-bold">Facebook</span>
          </button>

          {/* LinkedIn */}
          <button
            onClick={() => shareToLinkedIn(shareDetails)}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-[12px] bg-[#f0fdfa] hover:bg-[#ccfbf1] border border-[#99f6e4] text-[#0f766e] transition-all cursor-pointer group"
            title="Share to LinkedIn"
          >
            <div className="w-10 h-10 rounded-full bg-[#0A66C2] text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Linkedin size={18} />
            </div>
            <span className="text-[11px] font-bold">LinkedIn</span>
          </button>

          {/* Instagram */}
          <button
            onClick={handleInstagram}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-[12px] bg-[#fdf2f8] hover:bg-[#fce7f3] border border-[#fbcfe8] text-[#be185d] transition-all cursor-pointer group"
            title="Share to Instagram"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Instagram size={19} />
            </div>
            <span className="text-[11px] font-bold">Instagram</span>
          </button>

          {/* Twitter / X */}
          <button
            onClick={() => shareToTwitter(shareDetails)}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-[12px] bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#e2e8f0] text-[#0f172a] transition-all cursor-pointer group"
            title="Share to X"
          >
            <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Twitter size={18} />
            </div>
            <span className="text-[11px] font-bold">X (Twitter)</span>
          </button>
        </div>

        {/* Primary Link (Top) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#64748b]">{primaryLabel}</label>
          <div className="flex items-center gap-2 p-1.5 pl-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-[10px] focus-within:border-primary transition-all">
            <input
              type="text"
              readOnly
              value={primaryUrl}
              className="flex-1 bg-transparent border-none text-xs text-[#334155] font-mono outline-none select-all"
            />
            <Button
              size="sm"
              variant={copiedPrimary ? 'secondary' : 'primary'}
              onClick={handleCopyPrimary}
              className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 h-8 text-xs font-bold"
            >
              {copiedPrimary ? (
                <><Check size={14} className="text-green-600" /> Copied!</>
              ) : (
                <><Copy size={14} /> {primaryButtonLabel}</>
              )}
            </Button>
          </div>
        </div>

        {/* Secondary Link (Bottom) */}
        {secondaryUrl && secondaryUrl !== primaryUrl && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#64748b]">{secondaryLabel}</label>
            <div className="flex items-center gap-2 p-1.5 pl-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-[10px] focus-within:border-primary transition-all">
              <input
                type="text"
                readOnly
                value={secondaryUrl}
                className="flex-1 bg-transparent border-none text-xs text-[#334155] font-mono outline-none select-all"
              />
              <Button
                size="sm"
                variant={copiedSecondary ? 'secondary' : 'outline'}
                onClick={handleCopySecondary}
                className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 h-8 text-xs font-bold !text-primary !border-primary hover:!bg-primary/10 hover:!text-primary"
              >
                {copiedSecondary ? (
                  <><Check size={14} className="text-green-600" /> Copied!</>
                ) : (
                  <><Copy size={14} /> {secondaryButtonLabel}</>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Native device share (if available) */}
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <Button
            variant="outline"
            onClick={handleNativeShare}
            className="w-full flex items-center justify-center gap-2 text-xs font-bold !text-[#334155] !border-[#cbd5e1] hover:!bg-[#f1f5f9] hover:!text-[#0f172a]"
          >
            <Share2 size={15} /> More Sharing Options
          </Button>
        )}
      </div>
    </Modal>
  );
};

export default ShareModal;
