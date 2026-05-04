import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Plus, Phone, 
  Trash2, CheckCircle2, 
  ChevronRight, ArrowLeft, Loader2,
  BookUser
} from 'lucide-react';
import { addressApi } from '@/shared/services/address.api';
import Navbar from '@/features/landing/components/Navbar';
import Footer from '@/features/landing/components/Footer';
import styles from './Addresses.module.css';

const Addresses: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    fullName: '', phone: '', pincode: '', state: '', city: '', houseNo: '', area: '', isDefault: false
  });

  const redirectPath = new URLSearchParams(location.search).get('redirect');

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const data = await addressApi.getAddresses();
      setAddresses(data);
    } catch (error) {
      console.error('Failed to fetch addresses', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addressApi.addAddress(form);
      await fetchAddresses();
      setShowForm(false);
      setForm({ fullName: '', phone: '', pincode: '', state: '', city: '', houseNo: '', area: '', isDefault: false });
      
      if (redirectPath) {
        navigate(redirectPath);
      }
    } catch (error) {
      console.error('Failed to save address', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      await addressApi.deleteAddress(id);
      setAddresses(addresses.filter(a => a._id !== id));
    } catch (error) {
      console.error('Failed to delete address', error);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await addressApi.setDefault(id);
      await fetchAddresses();
    } catch (error) {
      console.error('Failed to set default address', error);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <Navbar />
        <div className={styles.loaderWrap}>
          <Loader2 className={styles.spinner} size={48} />
          <p>Loading addresses...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.titleArea}>
              <h1 className={styles.title}>My Addresses</h1>
              <p className={styles.subtitle}>Manage your delivery addresses</p>
            </div>
            {!showForm && (
              <button className={styles.addBtnTop} onClick={() => setShowForm(true)}>
                <Plus size={18} /> Add New Address
              </button>
            )}
          </div>

          {showForm ? (
            <div className={styles.formCard}>
              <button className={styles.backLink} onClick={() => setShowForm(false)}>
                <ArrowLeft size={18} /> Back to My Addresses
              </button>
              <h2 className={styles.formTitle}>Add New Address</h2>
              
              <form className={styles.form} onSubmit={handleSave}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Full Name</label>
                    <input required type="text" placeholder="Enter full name" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Phone Number</label>
                    <input required type="tel" placeholder="10-digit mobile number" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Pincode</label>
                    <input required type="text" placeholder="6 digits PIN code" value={form.pincode} onChange={e => setForm({...form, pincode: e.target.value})} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>State</label>
                    <input required type="text" placeholder="State" value={form.state} onChange={e => setForm({...form, state: e.target.value})} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>City</label>
                    <input required type="text" placeholder="City" value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>House No. / Building</label>
                    <input required type="text" placeholder="House No." value={form.houseNo} onChange={e => setForm({...form, houseNo: e.target.value})} />
                  </div>
                </div>
                
                <div className={styles.formGroupFull}>
                  <label>Area / Street / Sector</label>
                  <textarea required rows={3} placeholder="Area details" value={form.area} onChange={e => setForm({...form, area: e.target.value})}></textarea>
                </div>

                <div className={styles.checkboxRow}>
                  <input type="checkbox" id="default" checked={form.isDefault} onChange={e => setForm({...form, isDefault: e.target.checked})} />
                  <label htmlFor="default">Make this my default address</label>
                </div>

                <button type="submit" className={styles.saveBtn} disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Address'}
                </button>
              </form>
            </div>
          ) : addresses.length === 0 ? (
            <div className={styles.emptyCard}>
              <div className={styles.emptyIconWrap}>
                <BookUser size={48} color="#94a3b8" />
              </div>
              <h2 className={styles.emptyTitle}>No Addresses Found</h2>
              <p className={styles.emptyText}>You haven't added any addresses yet</p>
              <button className={styles.addBtnBig} onClick={() => setShowForm(true)}>
                <Plus size={18} /> Add Your First Address
              </button>
            </div>
          ) : (
            <div className={styles.addressList}>
              {addresses.map((addr) => (
                <div key={addr._id} className={`${styles.addressCard} ${addr.isDefault ? styles.defaultCard : ''}`}>
                  {addr.isDefault && (
                    <div className={styles.defaultBadge}>
                      <CheckCircle2 size={12} /> Default
                    </div>
                  )}
                  
                  <div className={styles.cardHeader}>
                    <div className={styles.userInfo}>
                      <h3 className={styles.userName}>{addr.fullName}</h3>
                      <span className={styles.tag}>Home</span>
                    </div>
                    <div className={styles.actions}>
                      {!addr.isDefault && (
                        <button className={styles.actionBtn} onClick={() => handleSetDefault(addr._id)}>Set Default</button>
                      )}
                      <button className={styles.deleteBtn} onClick={() => handleDelete(addr._id)}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className={styles.addressBody}>
                    <p className={styles.addrText}>
                      {addr.houseNo}, {addr.area}<br/>
                      {addr.city}, {addr.state} - {addr.pincode}
                    </p>
                    <div className={styles.phoneInfo}>
                      <Phone size={14} /> {addr.phone}
                    </div>
                  </div>
                  
                  {redirectPath && (
                    <button className={styles.deliverHereBtn} onClick={() => navigate(redirectPath)}>
                      Deliver to this address <ChevronRight size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Addresses;
