import React, { useState } from 'react';
import { Copy, Share2, Link2, Store, ShoppingBag, Users, QrCode, MessageCircle, Check } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import toast from 'react-hot-toast';
import { Card, SectionHeader, Badge, FieldLabel } from './partner.ui';
import type { PartnerProfile, PartnerReferralLinks } from '../services/partner.service';

interface LinkSpec {
  key: keyof PartnerReferralLinks;
  label: string;
  description: string;
  icon: typeof Store;
  pitch: string;
}

const LINK_SPECS: LinkSpec[] = [
  {
    key: 'supplier',
    label: 'Seller / Manufacturer',
    description:
      'Send this to factories, mills and wholesalers. They land straight on the seller sign-up with your code attached.',
    icon: Store,
    pitch:
      'List your products on AMJ Star and reach verified bulk buyers across India. Register as a seller here:',
  },
  {
    key: 'buyer',
    label: 'Buyer / Retailer',
    description:
      'Send this to shops, distributors and institutional buyers who purchase in bulk.',
    icon: ShoppingBag,
    pitch:
      'Buy wholesale directly from verified manufacturers on AMJ Star — no middlemen. Register as a buyer here:',
  },
  {
    key: 'reseller',
    label: 'Reseller',
    description:
      'For agents and traders who resell on margin rather than hold stock.',
    icon: Users,
    pitch: 'Earn margin reselling verified wholesale stock on AMJ Star. Register as a reseller here:',
  },
  {
    key: 'generic',
    label: 'Universal link',
    description:
      'Lets the person pick their own role. Best for WhatsApp groups and printed material.',
    icon: Link2,
    pitch: 'Join AMJ Star — India\'s verified B2B wholesale marketplace. Register here:',
  },
];

const PartnerShareLinks: React.FC<{
  partner?: PartnerProfile;
  referralLinks?: PartnerReferralLinks;
}> = ({ partner, referralLinks }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [qrFor, setQrFor] = useState<LinkSpec | null>(null);

  const copy = async (text: string, key: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toast.success(`${label} copied`);
      window.setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1800);
    } catch {
      toast.error('Could not copy — long-press the link to copy it manually');
    }
  };

  const shareWhatsApp = (url: string, pitch: string) => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${pitch}\n${url}`)}`, '_blank');
  };

  const nativeShare = async (url: string, label: string, pitch: string) => {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: `AMJ Star — ${label}`, text: pitch, url });
        return;
      } catch {
        /* the user dismissed the sheet — fall through to copying */
      }
    }
    void copy(url, label, label);
  };

  const downloadQr = (spec: LinkSpec) => {
    const canvas = document.querySelector<HTMLCanvasElement>('#partner-qr-canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `amjstar-${partner?.partnerCode || 'partner'}-${spec.key}-qr.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  if (!partner) return null;

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Your referral links"
        subtitle="Every sign-up through these links is permanently credited to you. Share the link that matches who you are talking to."
        icon={Share2}
        actions={
          <Badge tone="brand">
            Code&nbsp;<span className="font-mono">{partner.partnerCode}</span>
          </Badge>
        }
      />

      <Card className="p-5">
        <FieldLabel>Your partner code</FieldLabel>
        <div className="flex items-center gap-2 flex-wrap">
          <code className="px-4 py-2.5 rounded-[8px] bg-[#0f172a] text-white font-mono text-base font-bold tracking-[0.15em]">
            {partner.partnerCode}
          </code>
          <button
            onClick={() => copy(partner.partnerCode, 'code', 'Partner code')}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-[8px] border border-[#e2e8f0] bg-white text-xs font-bold text-[#334155] cursor-pointer hover:border-[#cbd5e1] transition-colors"
          >
            {copiedKey === 'code' ? <Check size={14} className="text-[#059669]" /> : <Copy size={14} />}
            {copiedKey === 'code' ? 'Copied' : 'Copy code'}
          </button>
        </div>
        <p className="text-xs text-[#64748b] m-0 mt-3 leading-relaxed">
          Anyone registering on AMJ Star can type this code into the “Partner code” field during
          sign-up — useful when someone has already started registering without your link.
        </p>
      </Card>

      {/* ── Referral Earning Rates ── */}
      <div className="p-4 rounded-[12px] bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-700">
        <div className="space-y-1">
          <div className="font-bold text-slate-900">Your Referral Payout Rules:</div>
          <div className="text-[11px] text-slate-600 leading-relaxed">
            • <strong>Seller Sign-up:</strong> You earn <strong>{partner.sellerCommissionPercent ?? 15}%</strong> of AMJ's fee on their sales.<br />
            • <strong>Buyer Sign-up:</strong> You earn <strong>{partner.buyerCommissionPercent ?? 10}%</strong> of AMJ's fee on their purchases.<br />
            • <strong>Both parties referred by you:</strong> You earn the full <strong>{Math.round(((partner.sellerCommissionPercent ?? 15) + (partner.buyerCommissionPercent ?? 10)) * 100) / 100}%</strong> cut.<br />
            • <strong>Only one side referred (other side organic):</strong> You receive your full rate for your side (Seller cut or Buyer cut).
          </div>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {LINK_SPECS.map((spec) => {
          const url = referralLinks?.[spec.key] || '';
          const Icon = spec.icon;
          return (
            <Card key={spec.key} className="p-5 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <span className="shrink-0 w-10 h-10 rounded-[10px] bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] flex items-center justify-center">
                  <Icon size={18} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-extrabold text-[#0f172a] m-0">{spec.label}</h3>
                  <p className="text-[11px] text-[#64748b] m-0 mt-1 leading-relaxed">{spec.description}</p>
                </div>
              </div>

              <div className="px-3 py-2.5 rounded-[8px] bg-[#f8fafc] border border-[#e2e8f0] text-[11px] text-[#334155] font-mono break-all">
                {url || '—'}
              </div>

              <div className="flex items-center gap-2 flex-wrap mt-auto">
                <button
                  onClick={() => copy(url, spec.key, `${spec.label} link`)}
                  disabled={!url}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[8px] bg-[#0f172a] text-white text-[11px] font-extrabold uppercase tracking-wider cursor-pointer disabled:opacity-50 hover:bg-[#1e293b] transition-colors border-none"
                >
                  {copiedKey === spec.key ? <Check size={13} /> : <Copy size={13} />}
                  {copiedKey === spec.key ? 'Copied' : 'Copy'}
                </button>
                <button
                  onClick={() => shareWhatsApp(url, spec.pitch)}
                  disabled={!url}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[8px] bg-[#059669] text-white text-[11px] font-extrabold uppercase tracking-wider cursor-pointer disabled:opacity-50 hover:bg-[#047857] transition-colors border-none"
                >
                  <MessageCircle size={13} />
                  WhatsApp
                </button>
                <button
                  onClick={() => nativeShare(url, spec.label, spec.pitch)}
                  disabled={!url}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[8px] border border-[#e2e8f0] bg-white text-[#334155] text-[11px] font-extrabold uppercase tracking-wider cursor-pointer disabled:opacity-50 hover:border-[#cbd5e1] transition-colors"
                >
                  <Share2 size={13} />
                  Share
                </button>
                <button
                  onClick={() => setQrFor(spec)}
                  disabled={!url}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[8px] border border-[#e2e8f0] bg-white text-[#334155] text-[11px] font-extrabold uppercase tracking-wider cursor-pointer disabled:opacity-50 hover:border-[#cbd5e1] transition-colors"
                >
                  <QrCode size={13} />
                  QR
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {qrFor && referralLinks?.[qrFor.key] && (
        <div
          className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setQrFor(null)}
        >
          <div
            className="bg-white rounded-[16px] p-6 w-full max-w-[340px] text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-extrabold text-[#0f172a] m-0">{qrFor.label} QR code</h3>
            <p className="text-[11px] text-[#64748b] m-0 mt-1 mb-4">
              Print it on a card or show it on your phone — scanning opens your referral link.
            </p>
            <div className="flex justify-center p-4 bg-white rounded-[12px] border border-[#e2e8f0]">
              <QRCodeCanvas
                id="partner-qr-canvas"
                value={referralLinks[qrFor.key]}
                size={200}
                level="M"
                includeMargin
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => downloadQr(qrFor)}
                className="flex-1 px-3 py-2.5 rounded-[8px] bg-[#0f172a] text-white text-[11px] font-extrabold uppercase tracking-wider cursor-pointer border-none hover:bg-[#1e293b]"
              >
                Download PNG
              </button>
              <button
                onClick={() => setQrFor(null)}
                className="px-4 py-2.5 rounded-[8px] border border-[#e2e8f0] bg-white text-[#334155] text-[11px] font-extrabold uppercase tracking-wider cursor-pointer hover:border-[#cbd5e1]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerShareLinks;
