import React from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, Image as ImageIcon } from 'lucide-react';

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
  return createPortal(
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="bg-white rounded-[12px] w-full max-w-[400px] shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-[#e2e8f0] flex justify-between items-center bg-[#f8fafc]">
          <div>
            <h3 className="text-sm font-extrabold text-[#0f172a] m-0">Review Purchase Order</h3>
            <p className="text-[11px] text-[#64748b] m-0 mt-0.5">Please confirm details before generating PO.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center bg-white border border-[#e2e8f0] text-[#64748b] cursor-pointer hover:bg-[#f1f5f9]"><X size={16} /></button>
        </div>
        
        <div className="p-5 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wide m-0">Product Details</p>
            <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] p-3 text-[11px] text-[#334155]">
              <div className="flex items-center gap-3 mb-2 pb-2 border-b border-[#e2e8f0]">
                {product?.images?.[0] ? (
                  <img src={product.images[0]} alt={quote.items?.[0]?.name} className="w-10 h-10 object-cover rounded-[6px] border border-[#cbd5e1]" />
                ) : (
                  <div className="w-10 h-10 bg-[#e2e8f0] rounded-[6px] flex items-center justify-center shrink-0 border border-[#cbd5e1]">
                    <ImageIcon size={16} className="text-[#94a3b8]" />
                  </div>
                )}
                <span className="font-semibold text-sm text-[#0f172a]">{quote.items?.[0]?.name}</span>
              </div>
              <div className="flex justify-between text-[#64748b]">
                <span>Quantity</span>
                <span>{quote.items?.[0]?.quantity} Units</span>
              </div>
              <div className="flex justify-between text-[#64748b]">
                <span>Unit Price</span>
                <span>₹{quote.items?.[0]?.price?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[#64748b] mt-1 pt-1 border-t border-[#e2e8f0]">
                <span>Subtotal</span>
                <span className="font-semibold text-[#0f172a]">₹{(quote.items?.[0]?.quantity * quote.items?.[0]?.price)?.toLocaleString('en-IN')}</span>
              </div>
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
                <span>₹{quote.taxableAmount?.toLocaleString('en-IN') || (quote.items?.[0]?.quantity * quote.items?.[0]?.price)?.toLocaleString('en-IN')}</span>
              </div>
              {quote.gstType !== 'exempt' && (
                <div className="flex justify-between">
                  <span className="text-[#64748b]">GST ({quote.gstType === 'IGST' ? 'IGST' : 'CGST+SGST'} @ {quote.gstRate}%)</span>
                  <span>₹{quote.gstAmount?.toLocaleString('en-IN') || 0}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#64748b]">Shipping Cost</span>
                <span>{quote.transportationTerms?.includes('Ex.') || quote.transportationTerms?.includes('To Pay') ? '₹0 (Buyer Arranges)' : `₹${quote.shippingCost?.toLocaleString('en-IN') || 0}`}</span>
              </div>
              {quote.transportationTerms === 'Third-Party Courier' && (quote.shippingCost || 0) > 0 && (
                <div className="flex justify-between text-[#0369a1]">
                  <span>Courier GST (18%)</span>
                  <span>₹{Math.round((quote.shippingCost || 0) * 0.18).toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 mt-0.5 border-t border-[#e2e8f0] font-extrabold text-sm text-[#0f172a]">
                <span>Grand Total</span>
                <span>₹{quote.totalAmount?.toLocaleString('en-IN')}</span>
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

        <div className="p-4 border-t border-[#e2e8f0] flex gap-2 bg-[#f8fafc]">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-xs font-semibold text-[#475569] bg-white border border-[#cbd5e1] rounded-[8px] cursor-pointer hover:bg-[#f1f5f9] transition-colors"
          >Cancel</button>
          <button
            disabled={!reviewAck}
            onClick={onConfirm}
            className="flex-1 py-2 text-xs font-bold text-white bg-[#059669] rounded-[8px] border-none cursor-pointer hover:bg-[#047857] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >Confirm</button>
        </div>
      </div>
    </div>,
    document.body
  );
};
