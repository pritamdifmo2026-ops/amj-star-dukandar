import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X, ChevronRight, ChevronLeft, Send, MapPin, Check } from 'lucide-react';
import { setCredentials } from '@/features/auth/store/auth.slice';
import authService from '@/features/auth/services/auth.service';
import { addressApi } from '@/features/buyer/services/address.api';
import { indiaStates, stateCityMap } from '@/utils/indiaAddressData';

interface EnquiryModalProps {
  productName: string;
  basePrice: number;
  moq: number;
  stock: number;
  unit: string;
  onSubmit: (enquiry: EnquiryPayload) => Promise<void>;
  onClose: () => void;
}

export interface EnquiryPayload {
  quantity: number;
  targetPrice: number | null;
  deliveryTimeline: string;
  requirements: string;
  note: string;
  deliveryAddress: {
    fullAddress?: string;
    city: string;
    state: string;
    pincode: string;
  };
}

type Step = 1 | 2 | 3 | 4;
type AddrMode = 'saved' | 'new';

const TIMELINE_OPTIONS = ['Within 7 days', 'Within 30 days', 'Flexible'];
const REQUIREMENT_OPTIONS = ['Standard', 'Custom Packaging', 'Certificate Needed'];

const chip = (active: boolean) =>
  `px-4 py-2.5 rounded-full text-sm font-semibold border cursor-pointer transition-all select-none ${
    active
      ? 'bg-primary text-white border-primary'
      : 'bg-white text-[#475569] border-[#e2e8f0] hover:border-primary hover:text-primary'
  }`;

const inputCls = "w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 text-sm text-[#1e293b] outline-none focus:border-primary transition-colors bg-white";

const EnquiryModal: React.FC<EnquiryModalProps> = ({
  productName, basePrice, moq, stock, unit, onSubmit, onClose,
}) => {
  const user = useSelector((state: any) => state.auth.user);
  const dispatch = useDispatch();

  // Saved address from profile
  const savedAddress = user?.address?.city ? user.address as { city: string; state: string; pincode: string; fullAddress?: string } : null;

  const [step, setStep] = useState<Step>(1);

  // Step 1
  const [quantity, setQuantity] = useState<number>(moq);
  const [customQty, setCustomQty] = useState('');
  const [useCustomQty, setUseCustomQty] = useState(false);

  // Step 2
  const [priceMode, setPriceMode] = useState<'quoted' | 'negotiate' | 'custom'>('quoted');
  const [customPrice, setCustomPrice] = useState('');

  // Step 3 — delivery timeline + address
  const [timeline, setTimeline] = useState('Within 30 days');
  const [addrMode, setAddrMode] = useState<AddrMode>(savedAddress ? 'saved' : 'new');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [saveToProfile, setSaveToProfile] = useState(false);

  // Step 4
  const [requirements, setRequirements] = useState<string[]>(['Standard']);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const qtyOptions = [moq, moq * 2, moq * 5].filter((v, i, a) => a.indexOf(v) === i && v <= stock);
  const finalQty = useCustomQty ? Number(customQty) || moq : quantity;
  const finalPrice = priceMode === 'custom' ? Number(customPrice) || null : null;

  const newAddrValid = city.trim() !== '' && state.trim() !== '' && /^\d{6}$/.test(pincode.trim());

  const handleStateChange = (selectedState: string) => {
    setState(selectedState);
    setCity('');
  };

  const canProceed = () => {
    if (step === 1) return (useCustomQty ? Number(customQty) >= 1 && Number(customQty) <= stock : quantity <= stock);
    if (step === 2) return priceMode !== 'custom' || Number(customPrice) > 0;
    if (step === 3) return addrMode === 'saved' || newAddrValid;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const deliveryAddress = addrMode === 'saved' && savedAddress
        ? { city: savedAddress.city, state: savedAddress.state, pincode: savedAddress.pincode, fullAddress: savedAddress.fullAddress }
        : { city: city.trim(), state: state.trim(), pincode: pincode.trim(), fullAddress: fullAddress.trim() || undefined };

      // Optionally save new address to profile + address book
      if (addrMode === 'new' && saveToProfile && newAddrValid) {
        try {
          const response = await authService.updateProfile({ address: deliveryAddress });
          dispatch(setCredentials({ user: response.user }));
        } catch {
          // non-fatal
        }
        try {
          await addressApi.addAddress({
            fullName: (user as any)?.name || '',
            phone: (user as any)?.phone || '',
            pincode: pincode.trim(),
            state: state.trim(),
            city: city.trim(),
            houseNo: fullAddress.trim(),
            area: '',
            isDefault: false,
          });
        } catch {
          // non-fatal
        }
      }

      await onSubmit({
        quantity: finalQty,
        targetPrice: finalPrice,
        deliveryTimeline: timeline,
        requirements: requirements.join(', '),
        note: note.trim(),
        deliveryAddress,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleReq = (r: string) =>
    setRequirements(prev =>
      prev.includes(r) ? (prev.length > 1 ? prev.filter(x => x !== r) : prev) : [...prev, r]
    );

  const stepLabels = ['Quantity', 'Price', 'Delivery', 'Requirements'];

  const finalAddr = addrMode === 'saved' && savedAddress
    ? [savedAddress.fullAddress, savedAddress.city, savedAddress.state, savedAddress.pincode].filter(Boolean).join(', ')
    : [fullAddress, city, state, pincode].filter(Boolean).join(', ');

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[3px]" />
      <div
        className="relative bg-white rounded-[16px] w-full max-w-[500px] max-h-[90vh] overflow-y-auto shadow-[0_24px_64px_rgba(0,0,0,0.18)]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[#f1f5f9] sticky top-0 bg-white z-10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-[#94a3b8] font-semibold uppercase tracking-wider mb-1">Enquiry for</p>
              <h2 className="text-base font-extrabold text-[#0f172a] m-0 line-clamp-1">{productName}</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f8fafc] border border-[#e2e8f0] text-[#64748b] cursor-pointer hover:bg-[#f1f5f9] shrink-0">
              <X size={16} />
            </button>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-1 mt-4">
            {stepLabels.map((label, i) => {
              const s = (i + 1) as Step;
              const done = step > s;
              const active = step === s;
              return (
                <React.Fragment key={s}>
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold transition-all ${done ? 'bg-primary text-white' : active ? 'bg-primary text-white ring-4 ring-primary/20' : 'bg-[#f1f5f9] text-[#94a3b8]'}`}>
                      {done ? '✓' : s}
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${active ? 'text-primary' : 'text-[#cbd5e1]'}`}>{label}</span>
                  </div>
                  {i < 3 && <div className={`flex-1 h-[2px] mb-4 rounded transition-all ${done ? 'bg-primary' : 'bg-[#f1f5f9]'}`} />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step content */}
        <div className="px-6 py-6">

          {/* Step 1: Quantity */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-base font-extrabold text-[#0f172a] m-0 mb-1">How much do you need?</h3>
                <p className="text-xs text-[#94a3b8] m-0">Minimum order: {moq} {unit}s | Available: {stock} {unit}s</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {qtyOptions.map(q => (
                  <button key={q} onClick={() => { setUseCustomQty(false); setQuantity(q); }} className={chip(!useCustomQty && quantity === q)}>
                    {q} {unit}s
                  </button>
                ))}
                <button onClick={() => setUseCustomQty(true)} className={chip(useCustomQty)}>Custom…</button>
              </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center border border-[#e2e8f0] rounded-[8px] bg-white focus-within:border-primary transition-colors">
                    <input autoFocus type="number" min={1} max={stock} value={customQty} onChange={e => setCustomQty(e.target.value)}
                      placeholder={`Min ${moq}, Max ${stock}`} className="flex-1 border-none outline-none px-3 py-2.5 text-sm bg-transparent" />
                    <span className="px-3 text-sm text-[#94a3b8] font-semibold border-l border-[#e2e8f0]">{unit}s</span>
                  </div>
                  {Number(customQty) > stock && (
                    <p className="text-[10px] text-[#ef4444] m-0 font-medium">Quantity exceeds available stock ({stock} {unit}s).</p>
                  )}
                </div>
            </div>
          )}

          {/* Step 2: Price */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-base font-extrabold text-[#0f172a] m-0 mb-1">What's your budget for this order?</h3>
                <p className="text-xs text-[#94a3b8] m-0">
                  Listed total: ₹{(basePrice * finalQty).toLocaleString()} for {finalQty} {unit}s
                  <span className="ml-1 text-[#cbd5e1]">(₹{basePrice?.toLocaleString()}/{unit})</span>
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {(['quoted', 'negotiate', 'custom'] as const).map(mode => {
                  const labels = { quoted: 'Accept listed price', negotiate: 'Open to negotiation', custom: 'I have a target budget' };
                  return (
                    <button key={mode} onClick={() => setPriceMode(mode)}
                      className={`text-left px-4 py-3 rounded-[10px] text-sm font-semibold border cursor-pointer transition-all ${priceMode === mode ? 'bg-primary/5 border-primary text-primary' : 'bg-white border-[#e2e8f0] text-[#475569] hover:border-primary/40'}`}>
                      {labels[mode]}
                    </button>
                  );
                })}
              </div>
              {priceMode === 'custom' && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center border border-[#e2e8f0] rounded-[8px] bg-white focus-within:border-primary transition-colors">
                    <span className="px-3 py-2.5 text-sm text-[#94a3b8] font-bold border-r border-[#e2e8f0] bg-[#f8fafc] rounded-l-[8px]">₹</span>
                    <input autoFocus type="number" min={1} value={customPrice} onChange={e => setCustomPrice(e.target.value)}
                      placeholder={`e.g. ${Math.round(basePrice * finalQty * 0.9)}`}
                      className="flex-1 border-none outline-none px-3 py-2.5 text-sm bg-transparent" />
                    <span className="px-3 text-sm text-[#94a3b8] font-semibold border-l border-[#e2e8f0]">total</span>
                  </div>
                  {Number(customPrice) > 0 && finalQty > 0 && (
                    <p className="text-xs text-[#64748b] m-0 pl-1">
                      = ₹{(Number(customPrice) / finalQty).toFixed(2)} / {unit}
                      {Number(customPrice) < basePrice * finalQty && (
                        <span className="ml-1 text-primary font-semibold">
                          ({Math.round((1 - Number(customPrice) / (basePrice * finalQty)) * 100)}% below listed)
                        </span>
                      )}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Delivery timeline + address */}
          {step === 3 && (
            <div className="flex flex-col gap-5">
              {/* Timeline */}
              <div className="flex flex-col gap-3">
                <h3 className="text-base font-extrabold text-[#0f172a] m-0">When do you need delivery?</h3>
                <div className="flex flex-col gap-2">
                  {TIMELINE_OPTIONS.map(t => (
                    <button key={t} onClick={() => setTimeline(t)}
                      className={`text-left px-4 py-3 rounded-[10px] text-sm font-semibold border cursor-pointer transition-all ${timeline === t ? 'bg-primary/5 border-primary text-primary' : 'bg-white border-[#e2e8f0] text-[#475569] hover:border-primary/40'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Address */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-primary shrink-0" />
                  <h3 className="text-sm font-extrabold text-[#0f172a] m-0">Delivery Address</h3>
                  <span className="text-[10px] text-[#94a3b8] font-semibold">(helps supplier quote shipping)</span>
                </div>

                {/* Saved address card */}
                {savedAddress && addrMode === 'saved' && (
                  <>
                    <div className="border border-primary/30 rounded-[10px] p-4 bg-[#fff7ed] flex items-start gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin size={14} className="text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Check size={12} className="text-primary" />
                          <p className="text-xs font-bold text-primary m-0">Using your saved address</p>
                        </div>
                        {savedAddress.fullAddress && (
                          <p className="text-sm text-[#0f172a] font-medium m-0">{savedAddress.fullAddress}</p>
                        )}
                        <p className="text-sm text-[#475569] m-0">
                          {[savedAddress.city, savedAddress.state].filter(Boolean).join(', ')} — {savedAddress.pincode}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAddrMode('new')}
                      className="text-xs font-semibold text-primary bg-transparent border-none cursor-pointer text-left hover:underline p-0 w-fit"
                    >
                      + Use a different address for this order
                    </button>
                  </>
                )}

                {/* New address form */}
                {addrMode === 'new' && (
                  <>
                    {savedAddress && (
                      <button
                        type="button"
                        onClick={() => setAddrMode('saved')}
                        className="text-xs font-semibold text-primary bg-transparent border-none cursor-pointer text-left hover:underline p-0 w-fit"
                      >
                        ← Use my saved address instead
                      </button>
                    )}

                    {!savedAddress && (
                      <p className="text-xs text-[#64748b] m-0 bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-3 py-2">
                        You don't have a saved address yet. Enter one below — the supplier will use this to quote shipping charges accurately.
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-[#64748b] uppercase tracking-wide">State *</label>
                        <select
                          value={state}
                          onChange={e => handleStateChange(e.target.value)}
                          className={inputCls}
                        >
                          <option value="">Select State</option>
                          {indiaStates.map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-[#64748b] uppercase tracking-wide">City *</label>
                        <select
                          value={city}
                          onChange={e => setCity(e.target.value)}
                          disabled={!state}
                          className={`${inputCls} disabled:opacity-60 disabled:cursor-not-allowed`}
                        >
                          <option value="">Select City</option>
                          {state && stateCityMap[state]?.map(ct => (
                            <option key={ct} value={ct}>{ct}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-[#64748b] uppercase tracking-wide">Pincode *</label>
                      <input type="text" value={pincode} onChange={e => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="6-digit PIN" className={inputCls} maxLength={6} />
                      {pincode.length > 0 && pincode.length < 6 && (
                        <p className="text-[10px] text-[#e65c00] m-0">Enter 6-digit pincode</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-[#64748b] uppercase tracking-wide">
                        Full Address <span className="font-normal text-[#94a3b8]">(optional)</span>
                      </label>
                      <textarea rows={2} value={fullAddress} onChange={e => setFullAddress(e.target.value)}
                        placeholder="Street / Building / Area…"
                        className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 text-sm text-[#1e293b] outline-none focus:border-primary transition-colors bg-white resize-none" />
                    </div>

                    {/* Save to profile checkbox */}
                    <button
                      type="button"
                      onClick={() => setSaveToProfile(s => !s)}
                      className="flex items-center gap-2.5 cursor-pointer bg-transparent border-none p-0 text-left"
                    >
                      <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 transition-colors ${saveToProfile ? 'bg-primary border-primary' : 'border-[#e2e8f0] bg-white'}`}>
                        {saveToProfile && <Check size={10} className="text-white" />}
                      </div>
                      <span className="text-xs text-[#475569] font-medium">
                        Save as my default delivery address
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Requirements + note */}
          {step === 4 && (
            <div className="flex flex-col gap-4">
              <h3 className="text-base font-extrabold text-[#0f172a] m-0">Any special requirements?</h3>
              <div className="flex flex-wrap gap-2">
                {REQUIREMENT_OPTIONS.map(r => (
                  <button key={r} onClick={() => toggleReq(r)} className={chip(requirements.includes(r))}>{r}</button>
                ))}
              </div>
              <textarea
                className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 text-sm text-[#1e293b] bg-white outline-none focus:border-primary transition-colors resize-none"
                placeholder="Any additional notes for the supplier… (optional)"
                rows={3} value={note} onChange={e => setNote(e.target.value)}
              />
              {/* Summary */}
              <div className="bg-[#f8fafc] rounded-[10px] p-3 text-xs text-[#475569] flex flex-col gap-1 border border-[#eef2f6]">
                <span className="font-bold text-[#0f172a] text-sm mb-1">Enquiry Summary</span>
                <span>Quantity: <strong>{finalQty} {unit}s</strong></span>
                <span>Price: <strong>
                  {priceMode === 'quoted'
                    ? `₹${(basePrice * finalQty).toLocaleString()} total (as listed)`
                    : priceMode === 'negotiate'
                    ? 'Open to negotiation'
                    : `₹${Number(customPrice).toLocaleString()} total`}
                </strong></span>
                <span>Delivery: <strong>{timeline}</strong></span>
                {finalAddr && <span>Ship to: <strong>{finalAddr}</strong></span>}
                <span>Requirements: <strong>{requirements.join(', ')}</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="px-6 pb-6 flex gap-3">
          {step > 1 && (
            <button onClick={() => setStep(s => (s - 1) as Step)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-[#64748b] bg-transparent border border-[#e2e8f0] rounded-[8px] cursor-pointer hover:bg-[#f8fafc] transition-colors">
              <ChevronLeft size={15} /> Back
            </button>
          )}
          <button
            disabled={!canProceed() || submitting}
            onClick={step < 4 ? () => setStep(s => (s + 1) as Step) : handleSubmit}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-primary rounded-[8px] cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed border-none">
            {step < 4 ? (
              <><span>Next</span><ChevronRight size={15} /></>
            ) : submitting ? 'Sending…' : (
              <><Send size={15} /><span>Send Enquiry</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnquiryModal;
