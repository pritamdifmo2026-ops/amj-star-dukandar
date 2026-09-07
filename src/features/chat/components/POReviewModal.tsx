import React from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, Image as ImageIcon } from 'lucide-react';

type GstBreakLine = { rate: number; taxable: number; gst: number };
const inr2 = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Per-rate GST rows with a single-rate fallback (see ChatInbox.gstDisplayLines).
function poGstLines(gstType: string | undefined, breakdown: GstBreakLine[] | undefined, fallbackRate: number, fallbackGst: number) {
  if (gstType === 'exempt') return [];
  const lines = (breakdown || []).filter(l => l && l.rate > 0 && l.gst > 0);
  const src: GstBreakLine[] = lines.length > 0 ? lines : (fallbackRate > 0 && fallbackGst > 0 ? [{ rate: fallbackRate, taxable: 0, gst: fallbackGst }] : []);
  const out: Array<{ label: string; value: number }> = [];
  for (const l of src) {
    if (gstType === 'IGST') out.push({ label: `IGST @ ${l.rate}%`, value: l.gst });
    else {
      out.push({ label: `CGST @ ${l.rate / 2}%`, value: Math.round((l.gst / 2) * 100) / 100 });
      out.push({ label: `SGST @ ${l.rate / 2}%`, value: Math.round((l.gst / 2) * 100) / 100 });
    }
  }
  return out;
}

interface POReviewModalProps {
  quote: any;
  product?: any;
  payMethod: 'direct' | 'amjstar';
  reviewAck: boolean;
  setReviewAck: (val: boolean) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export const POReviewModal: React.FC<POReviewModalProps> = ({
  quote,
  product,
  payMethod,
  reviewAck,
  setReviewAck,
  onClose,
  onConfirm
}) => {
  const items = (quote.items && quote.items.length > 0)
    ? quote.items
    : (product ? [{
        name: product.name,
        image: product.images?.[0],
        imageUrl: product.images?.[0],
        quantity: quote.quantity || 1,
        unit: quote.unit || 'Units',
        price: quote.proposedPrice || quote.price || 0,
        gstRate: quote.gstRate ?? 18,
      }] : []);

  const itemsTotal = items.reduce((acc: number, it: any) => acc + ((Number(it.price) || 0) * (Number(it.quantity) || 1)), 0);
  const taxableVal = quote.taxableAmount !== undefined && quote.taxableAmount !== null
    ? Number(quote.taxableAmount)
    : itemsTotal;

  const grandTotalVal = quote.totalAmount !== undefined && quote.totalAmount !== null
    ? Number(quote.totalAmount)
    : (taxableVal + Number(quote.gstAmount || 0) + Number(quote.shippingCost || 0));

  return createPortal(
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] z-[9999] flex items-center justify-center px-4" onClick={onClose}>
      <div className="bg-white rounded-[14px] w-full max-w-[500px] max-h-[90vh] shadow-2xl flex flex-col overflow-hidden my-auto" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-[#e2e8f0] flex justify-between items-center bg-[#f8fafc] shrink-0">
          <div>
            <h3 className="text-sm font-extrabold text-[#0f172a] m-0">Review Purchase Order</h3>
            <p className="text-[11px] text-[#64748b] m-0 mt-0.5">Please confirm details before generating PO.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center bg-white border border-[#e2e8f0] text-[#64748b] cursor-pointer hover:bg-[#f1f5f9] transition-colors"><X size={16} /></button>
        </div>
        
        <div className="p-5 flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wide m-0">Product Details</p>
              {items.length > 1 && (
                <span className="text-[10px] font-bold bg-[#f1f5f9] text-[#475569] px-2 py-0.5 rounded-full border border-[#e2e8f0]">
                  {items.length} Products
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2.5">
              {items.map((item: any, idx: number) => {
                const qty = Number(item.quantity) || 1;
                const unitPrice = Number(item.price) || 0;
                const itemTaxable = qty * unitPrice;
                const rate = quote.gstType === 'exempt' ? 0 : Number(item.gstRate ?? quote.gstRate ?? 18);
                const itemGst = quote.gstType === 'exempt' ? 0 : Math.round((itemTaxable * (rate / 100)) * 100) / 100;
                const itemTotalWithGst = itemTaxable + itemGst;

                return (
                  <div key={idx} className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] p-3 text-[11px] text-[#334155]">
                    <div className="flex items-center gap-3 mb-2 pb-2 border-b border-[#e2e8f0]">
                      {item.image || item.imageUrl || product?.images?.[0] ? (
                        <img src={item.image || item.imageUrl || product?.images?.[0]} alt={item.name} className="w-10 h-10 object-cover rounded-[6px] border border-[#cbd5e1]" />
                      ) : (
                        <div className="w-10 h-10 bg-[#e2e8f0] rounded-[6px] flex items-center justify-center shrink-0 border border-[#cbd5e1]">
                          <ImageIcon size={16} className="text-[#94a3b8]" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-sm text-[#0f172a] line-clamp-2">{item.name}</span>
                        {item.hsnCode && <span className="text-[10px] text-[#64748b]">HSN: {item.hsnCode}</span>}
                      </div>
                    </div>
                    <div className="flex justify-between text-[#64748b]">
                      <span>Quantity</span>
                      <span>{qty} {item.unit || 'Units'}</span>
                    </div>
                    <div className="flex justify-between text-[#64748b]">
                      <span>Unit Price (Excl. GST)</span>
                      <span>₹{inr2(unitPrice)}</span>
                    </div>
                    <div className="flex justify-between text-[#64748b]">
                      <span>Subtotal (Excl. GST)</span>
                      <span className="font-semibold text-[#0f172a]">₹{inr2(itemTaxable)}</span>
                    </div>
                    {quote.gstType !== 'exempt' && (
                      <div className="flex justify-between text-[#0369a1]">
                        <span>GST ({rate}%)</span>
                        <span className="font-semibold">+₹{inr2(itemGst)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[#0f172a] mt-1 pt-1 border-t border-[#e2e8f0] font-bold">
                      <span>Item Total (Incl. GST)</span>
                      <span className="text-[#059669]">₹{inr2(itemTotalWithGst)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wide m-0">Terms &amp; Conditions</p>
            <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] p-3 text-[11px] text-[#334155] flex flex-col gap-2">
              {quote.paymentTerms && (
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Payment Terms</span>
                  <span className="font-semibold text-[#0f172a]">{quote.paymentTerms}</span>
                </div>
              )}
              {quote.transportationTerms && (
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Transportation</span>
                  <span className="font-semibold text-[#0f172a]">{quote.transportationTerms}</span>
                </div>
              )}
              {quote.deliveryTimePreference && (
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Delivery Timeline</span>
                  <span className="font-semibold text-[#0f172a]">{quote.deliveryTimePreference}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wide m-0">Order Summary</p>
            <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] p-3 text-[11px] text-[#334155] flex flex-col gap-1.5">
              <div className="flex justify-between">
                <span className="text-[#64748b]">Taxable Amount</span>
                <span>₹{inr2(taxableVal)}</span>
              </div>
              {quote.gstType !== 'exempt' && poGstLines(quote.gstType, quote.gstBreakdown, Number(quote.gstRate) || 0, Number(quote.gstAmount) || 0).map((ln, li) => (
                <div key={li} className="flex justify-between">
                  <span className="text-[#64748b]">{ln.label}</span>
                  <span>₹{inr2(ln.value)}</span>
                </div>
              ))}
              <div className="flex justify-between">
                <span className="text-[#64748b]">Shipping Cost</span>
                <span>{quote.transportationTerms?.includes('Ex.') || quote.transportationTerms?.includes('To Pay') ? '₹0 (Buyer Arranges)' : `₹${quote.shippingCost?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 0}`}</span>
              </div>
              {quote.transportationTerms === 'Third-Party Courier' && (quote.shippingCost || 0) > 0 && (
                <div className="flex justify-between text-[#0369a1]">
                  <span>Courier GST (18%)</span>
                  <span>₹{(Math.round(((quote.shippingCost || 0) * 0.18) * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 mt-0.5 border-t border-[#e2e8f0] font-extrabold text-sm text-[#0f172a]">
                <span>Grand Total</span>
                <span>₹{inr2(grandTotalVal)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wide m-0">Payment Method</p>
            <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-[8px] p-2.5 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#059669]" />
              <div>
                <p className="text-xs font-bold text-[#065f46] m-0">{payMethod === 'direct' ? 'Direct Payment to Supplier' : 'Pay Through AMJSTAR (Escrow)'}</p>
                <p className="text-[10px] text-[#047857] m-0 mt-0.5">{payMethod === 'direct' ? 'Settle directly via UPI/Bank/Cash' : 'Secure escrow payment'}</p>
              </div>
            </div>
          </div>

          <label className="flex items-start gap-2.5 mt-2 cursor-pointer bg-white border border-[#e2e8f0] rounded-[8px] p-3 hover:border-[#cbd5e1] transition-colors">
            <input
              type="checkbox"
              checked={reviewAck}
              onChange={e => setReviewAck(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[#059669] shrink-0 cursor-pointer"
            />
            <span className="text-[11px] text-[#334155] leading-relaxed font-medium">
              I confirm the details above are correct and I wish to generate a legally binding Purchase Order.
              {payMethod === 'direct' && (
                <span className="block mt-1 text-[#475569] font-normal">
                  I understand that payment is handled <strong>directly between me and the supplier</strong>, and AMJSTAR is not responsible for the payment or its settlement.
                </span>
              )}
            </span>
          </label>
        </div>

        <div className="p-4 border-t border-[#e2e8f0] flex gap-2 bg-[#f8fafc] shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-xs font-semibold text-[#475569] bg-white border border-[#cbd5e1] rounded-[8px] cursor-pointer hover:bg-[#f1f5f9] transition-colors"
          >Cancel</button>
          <button
            disabled={!reviewAck}
            onClick={onConfirm}
            className="flex-1 py-2.5 text-xs font-bold text-white bg-[#059669] rounded-[8px] border-none cursor-pointer hover:bg-[#047857] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >Confirm</button>
        </div>
      </div>
    </div>,
    document.body
  );
};
