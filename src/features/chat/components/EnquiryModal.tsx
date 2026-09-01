import React, { useState, useEffect } from 'react';
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
  gstRate?: number;
  supplierProfile?: any;
  onSubmit: (enquiry: EnquiryPayload) => Promise<void>;
  onClose: () => void;
}

export interface EnquiryPayload {
  quantity: number;
  targetPrice: number | null;
  priceMode: 'quoted' | 'negotiate' | 'custom';
  deliveryTimeline: string;
  requirements: string;
  note?: string;
  deliveryAddress: {
    fullAddress?: string;
    city: string;
    state: string;
    pincode: string;
  };
  transportationTerms: string;
  paymentTerms: string;
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
  productName, basePrice, moq, stock, unit, gstRate, supplierProfile, onSubmit, onClose,
}) => {
  const user = useSelector((state: any) => state.auth.user);
  const dispatch = useDispatch();
  const [step, setStep] = useState<Step>(1);

  // Step 1
  const [quantity, setQuantity] = useState<number>(moq);
  const [customQty, setCustomQty] = useState('');
  const [useCustomQty, setUseCustomQty] = useState(false);

  // Step 2
  const [priceMode, setPriceMode] = useState<'quoted' | 'negotiate'>('quoted');
  const [customPrice, setCustomPrice] = useState('');

  // Step 3 — delivery timeline + address
  const [timeline, setTimeline] = useState('Within 30 days');
  const [addrMode, setAddrMode] = useState<AddrMode>('new');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [saveToProfile, setSaveToProfile] = useState(false);

  // Step 4
  const [requirements, setRequirements] = useState<string[]>(['Standard']);
  const [transportationTerms, setTransportationTerms] = useState(supplierProfile?.supportedTransportationTerms?.[0] || 'FOR');
  const [paymentTerms] = useState(supplierProfile?.supportedPaymentTerms?.[0] || '100% Advance');
  const [submitting, setSubmitting] = useState(false);

  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  useEffect(() => {
    addressApi.getAddresses().then(data => {
      let all: any[] = data;
      if (all.length === 0 && user?.address?.city) {
        all = [{
          _id: 'profile-address',
          fullName: user.name || '',
          phone: user.phone || '',
          pincode: user.address.pincode || '',
          state: user.address.state || '',
          city: user.address.city || '',
          fullAddress: user.address.fullAddress || '',
          isDefault: true,
        }];
      }
      setAddresses(all);
      const def = all.find((a: any) => a.isDefault) || all[0];
      if (def) {
        setSelectedAddressId(def._id);
        setAddrMode('saved');
      } else {
        setAddrMode('new');
      }
    }).catch(() => { });
  }, []);

  const savedAddress = addresses.find(a => a._id === selectedAddressId) || addresses[0];

  const qtyOptions = [moq, moq * 2, moq * 5].filter((v, i, a) => a.indexOf(v) === i && v <= stock);
  const finalQty = useCustomQty ? Number(customQty) || moq : quantity;
  const finalPrice = priceMode === 'negotiate' ? (Number(customPrice) * finalQty) || null : null;

  const newAddrValid = city.trim() !== '' && state.trim() !== '' && /^\d{6}$/.test(pincode.trim());

  const handleStateChange = (selectedState: string) => {
    setState(selectedState);
    setCity('');
  };

  const canProceed = () => {
    if (step === 1) return (useCustomQty ? Number(customQty) >= moq && Number(customQty) <= stock : quantity <= stock);
    if (step === 2) {
      if (priceMode === 'quoted') return true;
      const cp = Number(customPrice);
      return cp >= (basePrice * 0.5) && cp <= basePrice;
    }
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
        priceMode,
        deliveryTimeline: timeline,
        requirements: requirements.join(', '),
        deliveryAddress,
        transportationTerms,
        paymentTerms,
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
                    <input autoFocus type="number" min={moq} max={stock} value={customQty} onChange={e => setCustomQty(e.target.value)}
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
                  Listed total: ₹{(basePrice * finalQty).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} for {finalQty} {unit}s
                  <span className="ml-1 text-[#cbd5e1]">(₹{basePrice?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/{unit})</span>
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {(['quoted', 'negotiate'] as const).map(mode => {
                  const labels = { quoted: 'Accept listed price', negotiate: 'Open to negotiation' };
                  return (
                    <button key={mode} onClick={() => setPriceMode(mode)}
                      className={`text-left px-4 py-3 rounded-[10px] text-sm font-semibold border cursor-pointer transition-all ${priceMode === mode ? 'bg-primary/5 border-primary text-primary' : 'bg-white border-[#e2e8f0] text-[#475569] hover:border-primary/40'}`}>
                      {labels[mode]}
                    </button>
                  );
                })}
              </div>
              {priceMode === 'negotiate' && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-[#64748b]">Your target price per {unit}</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="range" 
                        min={Math.ceil(basePrice * 0.5)} 
                        max={basePrice} 
                        value={customPrice || (Math.round((basePrice * 0.9) * 100) / 100)} 
                        onChange={e => setCustomPrice(e.target.value)}
                        className="flex-1 accent-primary cursor-pointer h-2 bg-[#e2e8f0] rounded-lg appearance-none"
                      />
                      <div className="flex items-center border border-[#e2e8f0] rounded-[8px] bg-white focus-within:border-primary transition-colors w-[120px] shrink-0">
                        <span className="px-2 py-2 text-sm text-[#94a3b8] font-bold border-r border-[#e2e8f0] bg-[#f8fafc] rounded-l-[8px]">₹</span>
                        <input autoFocus type="number" min={Math.ceil(basePrice * 0.5)} max={basePrice} value={customPrice} onChange={e => setCustomPrice(e.target.value)}
                          placeholder={`${(Math.round((basePrice * 0.9) * 100) / 100)}`}
                          className="w-full border-none outline-none px-2 py-2 text-sm bg-transparent" />
                      </div>
                    </div>
                  </div>
                  
                  {Number(customPrice) > 0 && finalQty > 0 && (
                    <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] p-3 flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-xs text-[#64748b]">
                        <span>Total Price (excl. GST)</span>
                        <span className="font-bold text-[#0f172a]">₹{(Number(customPrice) * finalQty).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-[#94a3b8]">
                        <span>Est. Total with {gstRate ?? 18}% GST</span>
                        <span>₹{(Math.round((Number(customPrice) * finalQty * (1 + (gstRate ?? 18) / 100)) * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      
                      {Number(customPrice) < basePrice && (
                        <div className="mt-1 pt-1.5 border-t border-[#e2e8f0] text-right">
                          <span className="text-[10px] text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded">
                            {Math.round((1 - Number(customPrice) / basePrice) * 100)}% below listed
                          </span>
                        </div>
                      )}
                      
                      {Number(customPrice) > basePrice && (
                        <p className="text-[10px] text-[#ef4444] m-0 font-medium">Your offer cannot exceed the listed price per {unit} (₹{basePrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}).</p>
                      )}
                      {Number(customPrice) < basePrice * 0.5 && (
                        <p className="text-[10px] text-[#ef4444] m-0 font-medium">Your offer cannot be less than 50% of the listed price per {unit} (₹{Math.ceil(basePrice * 0.5).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}).</p>
                      )}
                    </div>
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

                {/* Saved address selection */}
                {addresses.length > 0 && addrMode === 'saved' && (
                  <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                    {addresses.map((addr) => (
                      <label
                        key={addr._id}
                        className={`flex items-start gap-3 p-3 rounded-[10px] border cursor-pointer transition-all ${selectedAddressId === addr._id
                            ? 'border-primary bg-[#fff7ed] shadow-[0_0_0_3px_rgba(230,92,0,0.08)]'
                            : 'border-[#e2e8f0] bg-white hover:border-[#e65c00]/30'
                          }`}
                      >
                        <input
                          type="radio"
                          name="enquiry_address"
                          value={addr._id}
                          checked={selectedAddressId === addr._id}
                          onChange={() => setSelectedAddressId(addr._id)}
                          className="mt-1 accent-[#e65c00]"
                        />
                        <div>
                          <p className="text-xs font-bold text-[#0f172a] m-0">{addr.fullName || 'Address'}</p>
                          <p className="text-[11px] text-[#64748b] m-0 mt-0.5 leading-relaxed">
                            {[addr.houseNo, addr.area, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      </label>
                    ))}
                    <button
                      type="button"
                      onClick={() => setAddrMode('new')}
                      className="text-xs font-semibold text-primary bg-transparent border-none cursor-pointer text-left hover:underline p-0 w-fit mt-1"
                    >
                      + Add a new address for this enquiry
                    </button>
                  </div>
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
              <div className="flex flex-wrap gap-2 mb-2">
                {REQUIREMENT_OPTIONS.map(r => (
                  <button key={r} onClick={() => toggleReq(r)} className={chip(requirements.includes(r))}>{r}</button>
                ))}
              </div>

              <div className="flex flex-col gap-3 mt-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#64748b] uppercase tracking-wide">Preferred Transportation *</label>
                  <select value={transportationTerms} onChange={(e) => setTransportationTerms(e.target.value)} className={inputCls}>
                    {supplierProfile?.supportedTransportationTerms?.length > 0 ? (
                      supplierProfile.supportedTransportationTerms.map((t: string) => (
                        <option key={t} value={t}>{t}</option>
                      ))
                    ) : (
                      <>
                        <option value="FOR">FOR (Free on Road)</option>
                        <option value="Ex-Works">Ex-Works</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-[#f8fafc] rounded-[10px] p-3 text-xs text-[#475569] flex flex-col gap-1 border border-[#eef2f6]">
                <span className="font-bold text-[#0f172a] text-sm mb-1">Enquiry Summary</span>
                <span>Quantity: <strong>{finalQty} {unit}s</strong></span>
                <span>Price: <strong>
                  {priceMode === 'quoted'
                    ? `₹${(basePrice * finalQty).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total (as listed)`
                    : `₹${Number(customPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total`}
                </strong></span>
                <span>Delivery: <strong>{timeline}</strong></span>
                {finalAddr && <span>Ship to: <strong>{finalAddr}</strong></span>}
                <span>Requirements: <strong>{requirements.join(', ')}</strong></span>
                <span>Transport: <strong>{transportationTerms}</strong></span>
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
              <><Send size={15} /><span>{Number(customPrice) === basePrice ? 'Buy at Listed Price' : 'Send Enquiry'}</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnquiryModal;
