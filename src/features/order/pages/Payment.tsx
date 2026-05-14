import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Wallet,
  Smartphone,
  Building2,
  ChevronRight,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import { ROUTES } from '@/shared/constants/routes';
import toast from 'react-hot-toast';

const inputCls = "w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 text-sm text-[#1e293b] outline-none focus:border-primary transition-colors";
const labelCls = "text-xs font-bold uppercase text-[#94a3b8] tracking-wider block mb-1.5";

const Payment: React.FC = () => {
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState<string>('upi');
  const [selectedUpi, setSelectedUpi] = useState<string>('gpay');

  const paymentMethods = [
    { id: 'upi', name: 'UPI', icon: <Smartphone size={22} />, description: 'Google Pay, PhonePe, Paytm & more' },
    { id: 'card', name: 'Credit / Debit / ATM Card', icon: <CreditCard size={22} />, description: 'Visa, Mastercard, RuPay & more' },
    { id: 'cod', name: 'Cash on Delivery', icon: <Wallet size={22} />, description: 'Pay at your doorstep' },
    { id: 'emi', name: 'EMI', icon: <Building2 size={22} />, description: 'Easy installments' },
  ];

  const upiOptions = [
    { id: 'gpay', name: 'Google Pay', icon: '/Gpay.webp' },
    { id: 'phonepe', name: 'PhonePe', icon: '/phonepe.png' },
    { id: 'paytm', name: 'Paytm', icon: '/paytm.png' },
    { id: 'amazonpay', name: 'Amazon Pay', icon: '/amazon pay.png' },
  ];

  const handlePayment = () => {
    toast.error('Please complete the payment through the chat quotation for now.');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 py-8 max-w-[1100px] mx-auto">
      <button
        className="flex items-center gap-2 text-sm text-[#64748b] bg-transparent border-none cursor-pointer hover:text-[#0f172a] p-0 mb-4"
        onClick={() => navigate(ROUTES.CHECKOUT)}
      >
        <ArrowLeft size={18} /> Back to Checkout
      </button>
      <h1 className="text-2xl font-extrabold text-[#0f172a] m-0 mb-1">Select Payment Method</h1>
      <p className="text-sm text-[#64748b] m-0 mb-7">Choose your preferred way to pay</p>

      <div className="flex gap-6 items-start max-lg:flex-col">
        <div className="w-[300px] max-lg:w-full flex flex-col gap-2">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className={`flex items-center gap-4 p-4 bg-white border-2 rounded-[10px] cursor-pointer transition-all ${selectedMethod === method.id ? 'border-primary bg-[#fff7ed]' : 'border-[#eef2f6] hover:border-[#e2e8f0]'}`}
              onClick={() => setSelectedMethod(method.id)}
            >
              <div className={`w-10 h-10 rounded-[8px] flex items-center justify-center shrink-0 ${selectedMethod === method.id ? 'bg-primary text-white' : 'bg-[#f1f5f9] text-[#475569]'}`}>
                {method.icon}
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-[#0f172a]">{method.name}</div>
                <div className="text-xs text-[#94a3b8]">{method.description}</div>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${selectedMethod === method.id ? 'border-primary' : 'border-[#d1d5db]'}`}>
                {selectedMethod === method.id && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1 bg-white border border-[#eef2f6] rounded-[12px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          {selectedMethod === 'upi' && (
            <div>
              <h2 className="text-base font-extrabold text-[#0f172a] m-0 mb-4">Select UPI App</h2>
              <div className="grid grid-cols-4 gap-3 mb-5 max-sm:grid-cols-2">
                {upiOptions.map((upi) => (
                  <div
                    key={upi.id}
                    className={`relative flex flex-col items-center gap-2 p-3 border-2 rounded-[10px] cursor-pointer transition-all ${selectedUpi === upi.id ? 'border-primary bg-[#fff7ed]' : 'border-[#e2e8f0] hover:border-primary'}`}
                    onClick={() => setSelectedUpi(upi.id)}
                  >
                    <img src={upi.icon} alt={upi.name} className="w-10 h-10 object-contain" />
                    <span className="text-xs font-semibold text-[#0f172a] text-center">{upi.name}</span>
                    {selectedUpi === upi.id && <CheckCircle2 size={16} className="absolute top-2 right-2 text-primary" />}
                  </div>
                ))}
              </div>
              <div>
                <label className={labelCls}>Or enter UPI ID</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="username@bank" className={inputCls} />
                  <button className="px-4 py-2.5 text-sm font-bold text-primary border border-primary rounded-[8px] bg-transparent cursor-pointer hover:bg-[#fff7ed] whitespace-nowrap">
                    Verify
                  </button>
                </div>
              </div>
            </div>
          )}

          {selectedMethod === 'card' && (
            <div>
              <h2 className="text-base font-extrabold text-[#0f172a] m-0 mb-4">Enter Card Details</h2>
              <div className="flex flex-col gap-4">
                <div>
                  <label className={labelCls}>Card Number</label>
                  <input type="text" placeholder="0000 0000 0000 0000" className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Expiry Date</label>
                    <input type="text" placeholder="MM / YY" autoComplete="off" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>CVV</label>
                    <input type="tel" placeholder="***" autoComplete="off" maxLength={3} className={inputCls} style={{ WebkitTextSecurity: 'disc' } as any} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Name on Card</label>
                  <input type="text" placeholder="Full Name" className={inputCls} />
                </div>
              </div>
            </div>
          )}

          {selectedMethod === 'cod' && (
            <div className="flex flex-col items-center py-8 gap-4 text-center">
              <div className="w-20 h-20 bg-[#fff7ed] rounded-full flex items-center justify-center text-primary">
                <Wallet size={40} />
              </div>
              <h2 className="text-base font-extrabold text-[#0f172a] m-0">Cash on Delivery</h2>
              <p className="text-sm text-[#64748b] m-0 max-w-[360px]">You can pay via Cash/Card/UPI at the time of delivery. A small handling fee might apply.</p>
            </div>
          )}

          {selectedMethod === 'emi' && (
            <div>
              <h2 className="text-base font-extrabold text-[#0f172a] m-0 mb-1">Select EMI Option</h2>
              <p className="text-sm text-[#64748b] m-0 mb-4">No Cost EMI available on selected banks.</p>
              <div className="flex flex-col gap-2">
                {['HDFC Bank', 'ICICI Bank', 'SBI Bank'].map((bank) => (
                  <div key={bank} className="flex items-center gap-3 p-3.5 border border-[#e2e8f0] rounded-[8px] cursor-pointer hover:border-primary hover:bg-[#f8fafc] transition-colors">
                    <Building2 size={18} className="text-[#475569]" />
                    <span className="flex-1 text-sm font-semibold text-[#0f172a]">{bank}</span>
                    <ChevronRight size={16} className="text-[#94a3b8]" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            className="w-full mt-6 py-3 bg-primary text-white font-bold text-sm rounded-[8px] border-none cursor-pointer hover:opacity-90 transition-opacity"
            onClick={handlePayment}
          >
            Pay Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default Payment;
