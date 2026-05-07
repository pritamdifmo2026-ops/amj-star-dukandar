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
import styles from './Payment.module.css';

const Payment: React.FC = () => {
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState<string>('upi');
  const [selectedUpi, setSelectedUpi] = useState<string>('gpay');

  const paymentMethods = [
    { id: 'upi', name: 'UPI', icon: <Smartphone size={24} />, description: 'Google Pay, PhonePe, Paytm & more' },
    { id: 'card', name: 'Credit / Debit / ATM Card', icon: <CreditCard size={24} />, description: 'Visa, Mastercard, RuPay & more' },
    { id: 'cod', name: 'Cash on Delivery', icon: <Wallet size={24} />, description: 'Pay at your doorstep' },
    { id: 'emi', name: 'EMI', icon: <Building2 size={24} />, description: 'Easy installments' },
  ];

  const upiOptions = [
    { id: 'gpay', name: 'Google Pay', icon: '/Gpay.webp' },
    { id: 'phonepe', name: 'PhonePe', icon: '/phonepe.png' },
    { id: 'paytm', name: 'Paytm', icon: '/paytm.png' },
    { id: 'amazonpay', name: 'Amazon Pay', icon: '/amazon pay.png' },
  ];

  const handlePayment = () => {
    alert(`Payment successful using ${selectedMethod}! (Demo)`);
    navigate(ROUTES.HOME);
  };

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Back to Checkout
        </button>
        <h1>Select Payment Method</h1>
        <p>Choose your preferred way to pay</p>
      </div>

      <div className={styles.paymentGrid}>
        <div className={styles.methodsList}>
          {paymentMethods.map((method) => (
            <div 
              key={method.id}
              className={`${styles.methodItem} ${selectedMethod === method.id ? styles.selected : ''}`}
              onClick={() => setSelectedMethod(method.id)}
            >
              <div className={styles.methodIcon}>{method.icon}</div>
              <div className={styles.methodInfo}>
                <h3>{method.name}</h3>
                <p>{method.description}</p>
              </div>
              <div className={styles.selector}>
                <div className={styles.radioOuter}>
                  {selectedMethod === method.id && <div className={styles.radioInner} />}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.detailsPanel}>
          {selectedMethod === 'upi' && (
            <div className={styles.upiSection}>
              <h2>Select UPI App</h2>
              <div className={styles.upiGrid}>
                {upiOptions.map((upi) => (
                  <div 
                    key={upi.id}
                    className={`${styles.upiItem} ${selectedUpi === upi.id ? styles.upiSelected : ''}`}
                    onClick={() => setSelectedUpi(upi.id)}
                  >
                    <img src={upi.icon} alt={upi.name} />
                    <span>{upi.name}</span>
                    {selectedUpi === upi.id && <CheckCircle2 size={16} className={styles.checkIcon} />}
                  </div>
                ))}
              </div>
              <div className={styles.upiInput}>
                <label>Or enter UPI ID</label>
                <div className={styles.inputWrapper}>
                  <input type="text" placeholder="username@bank" />
                  <button className={styles.verifyBtn}>Verify</button>
                </div>
              </div>
            </div>
          )}

          {selectedMethod === 'card' && (
            <div className={styles.cardSection}>
              <h2>Enter Card Details</h2>
              <div className={styles.cardForm}>
                <div className={styles.field}>
                  <label>Card Number</label>
                  <input type="text" placeholder="0000 0000 0000 0000" />
                </div>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label>Expiry Date</label>
                    <input type="text" placeholder="MM / YY" autoComplete="off" name="expiry_date_hidden" />
                  </div>
                  <div className={styles.field}>
                    <label>CVV</label>
                    <input type="tel" placeholder="***" autoComplete="off" name="cvv_number_hidden" maxLength={3} style={{ WebkitTextSecurity: 'disc' } as any} />
                  </div>
                </div>
                <div className={styles.field}>
                  <label>Name on Card</label>
                  <input type="text" placeholder="Full Name" />
                </div>
              </div>
            </div>
          )}

          {selectedMethod === 'cod' && (
            <div className={styles.codSection}>
              <div className={styles.codMessage}>
                <Wallet size={48} className={styles.codIcon} />
                <h2>Cash on Delivery</h2>
                <p>You can pay via Cash/Card/UPI at the time of delivery. A small handling fee might apply.</p>
              </div>
            </div>
          )}

          {selectedMethod === 'emi' && (
            <div className={styles.emiSection}>
              <h2>Select EMI Option</h2>
              <p className={styles.emiNotice}>No Cost EMI available on selected banks.</p>
              <div className={styles.bankList}>
                <div className={styles.bankItem}>
                  <Building2 size={20} />
                  <span>HDFC Bank</span>
                  <ChevronRight size={18} />
                </div>
                <div className={styles.bankItem}>
                  <Building2 size={20} />
                  <span>ICICI Bank</span>
                  <ChevronRight size={18} />
                </div>
                <div className={styles.bankItem}>
                  <Building2 size={20} />
                  <span>SBI Bank</span>
                  <ChevronRight size={18} />
                </div>
              </div>
            </div>
          )}

          <button className={styles.payNowBtn} onClick={handlePayment}>
            Pay Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default Payment;
