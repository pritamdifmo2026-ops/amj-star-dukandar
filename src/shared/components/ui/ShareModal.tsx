import React, { useState } from 'react';
import {
  MessageCircle, Send, Facebook, Linkedin, Twitter, Instagram,
  Copy, Check, Share2
} from 'lucide-react';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import { toast } from 'react-hot-toast';
import {
  toSocialOgJpeg,
  shareToWhatsApp,
  shareToTelegram,
  shareToFacebook,
  shareToLinkedIn,
  shareToTwitter
} from '@/shared/utils/ogImage';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  text?: string;
  url: string;
  imageUrl?: string | null;
  subtitle?: string;
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  title,
  text,
  url,
  imageUrl,
  subtitle,
}) => {
  const [copied, setCopied] = useState(false);

  // Compute preview image converted to social JPEG
  const previewImg = toSocialOgJpeg(imageUrl, 300, 80);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleInstagram = async () => {
    await handleCopy();
    toast.success('Link copied! Open Instagram to paste in your story, bio, or DM.', { duration: 4000 });
    window.open('https://instagram.com', '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: text ? `${title}\n${text}` : title,
          url,
        });
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  const shareDetails = { title, text, url };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share">
      <div className="flex flex-col gap-5 pt-1">
        {/* Preview Card */}
        <div className="flex items-center gap-3 p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-[12px] overflow-hidden">
          <div className="w-16 h-16 rounded-[8px] bg-white border border-[#e2e8f0] overflow-hidden shrink-0 flex items-center justify-center">
            <img
              src={previewImg}
              alt={title}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback if image fails to load
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-[#0f172a] truncate m-0">{title}</h4>
            {subtitle && <p className="text-xs font-semibold text-primary truncate mt-0.5 m-0">{subtitle}</p>}
            {text && <p className="text-xs text-[#64748b] line-clamp-1 mt-0.5 m-0">{text}</p>}
          </div>
        </div>

        {/* Social Share Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {/* WhatsApp */}
          <button
            onClick={() => shareToWhatsApp(shareDetails)}
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
            onClick={() => shareToTelegram(shareDetails)}
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

        {/* Copy Link Input Bar */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#64748b]">Share Link</label>
          <div className="flex items-center gap-2 p-1.5 pl-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-[10px] focus-within:border-primary transition-all">
            <input
              type="text"
              readOnly
              value={url}
              className="flex-1 bg-transparent border-none text-xs text-[#334155] font-mono outline-none select-all"
            />
            <Button
              size="sm"
              variant={copied ? 'secondary' : 'primary'}
              onClick={handleCopy}
              className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 h-8 text-xs font-bold"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-green-600" /> Copied!
                </>
              ) : (
                <>
                  <Copy size={14} /> Copy Link
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Native device share (if available) */}
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <Button
            variant="outline"
            onClick={handleNativeShare}
            className="w-full flex items-center justify-center gap-2 text-xs font-bold text-[#334155] border-[#cbd5e1] hover:bg-[#f8fafc]"
          >
            <Share2 size={15} /> More Sharing Options
          </Button>
        )}
      </div>
    </Modal>
  );
};

export default ShareModal;
