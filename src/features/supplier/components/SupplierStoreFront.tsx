import React, { useState } from 'react';
import { Store, Copy, CheckCircle, ExternalLink, QrCode, Download, Share2, MessageCircle } from 'lucide-react';
import Button from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';
import { QRCodeCanvas } from 'qrcode.react';

interface SupplierStoreFrontProps {
  supplierId: string;
}

const SupplierStoreFront: React.FC<SupplierStoreFrontProps> = ({ supplierId }) => {
  const [copied, setCopied] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  const storeLink = `${window.location.origin}/store/${supplierId}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(storeLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
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

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(`Check out our wholesale store on AMJSTAR!\n\n${storeLink}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Our Wholesale Store',
          text: 'Check out our wholesale store on AMJSTAR!',
          url: storeLink,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      copyToClipboard();
      alert('Link copied to clipboard. Your browser does not support native sharing.');
    }
  };

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

        <div className="mt-6 flex flex-col md:flex-row gap-4 items-stretch md:items-center">
          <div className="flex-1 w-full flex items-center gap-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-4 py-3">
            <span className="text-[#0f172a] font-medium text-sm truncate flex-1">{storeLink}</span>
            <button 
              onClick={copyToClipboard}
              className="text-[#64748b] hover:text-primary transition-colors cursor-pointer p-1"
              title="Copy Link"
            >
              {copied ? <CheckCircle size={18} className="text-[#059669]" /> : <Copy size={18} />}
            </button>
          </div>
          <div className="flex gap-2 max-md:w-full">
            <Button variant="outline" onClick={() => setShowQRModal(true)} className="flex-1 max-md:w-full flex items-center justify-center gap-2">
              <QrCode size={16} /> QR Code
            </Button>
            <Button onClick={openStorefront} className="flex-1 max-md:w-full flex items-center justify-center gap-2">
              <ExternalLink size={16} /> Visit Store
            </Button>
          </div>
        </div>
      </div>

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
              <Button variant="outline" onClick={shareToWhatsApp} className="w-full flex items-center justify-center gap-2 !bg-[#25D366] !text-white !border-none hover:!bg-[#128C7E]">
                <MessageCircle size={16} /> WhatsApp
              </Button>
              <Button variant="outline" onClick={shareNative} className="w-full flex items-center justify-center gap-2">
                <Share2 size={16} /> Share
              </Button>
            </div>
          </div>
          <Button variant="outline" onClick={() => setShowQRModal(false)} className="w-full mt-2 border-none bg-transparent hover:bg-[#f1f5f9]">
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default SupplierStoreFront;
