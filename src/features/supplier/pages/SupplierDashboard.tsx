import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logout } from '@/features/auth/store/auth.slice';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import logo from '@/assets/logoo.png';
import productService from '@/features/product/services/product.service';
import supplierService from '../services/supplier.service';
import toast from 'react-hot-toast';
import { chatApi } from '@/features/chat/services/chat.api';
import Button from '@/shared/components/ui/Button';
import {
  LayoutDashboard, Package, LogOut, Trash2, FileText, MessageCircle,
  Handshake, Menu, CheckCircle,
  AlertCircle, ShoppingBag, Settings as SettingsIcon, Wallet, BarChart2, Store,
  Star, ReceiptText, Ban, Video, MailWarning
} from 'lucide-react';
import NotificationBell from '@/features/notifications/components/NotificationBell';

import ProductTable from '../components/ProductTable';
import AddProductForm from '../components/AddProductForm';
import SupplierPartnerships from '../components/SupplierPartnerships';
import SupplierOverview from '../components/SupplierOverview';
import SupplierInventory from '../components/SupplierInventory';
import SupplierSettings from '../components/SupplierSettings';
import SupplierReviews from '../components/SupplierReviews';
import SupplierWallet from '../components/SupplierWallet';
import SupplierReports from '../components/SupplierReports';
import SupplierStoreFront from '../components/SupplierStoreFront';
import BillingManagement from '../components/BillingManagement';
import SubscriptionActivation from '../components/SubscriptionActivation';
import MembershipUpgrade from '../components/MembershipUpgrade';
import MembershipRenewalAlert from '../components/MembershipRenewalAlert';
import ChatInbox from '@/features/chat/components/ChatInbox';
import SupplierQuotations from '../components/SupplierQuotations';
import NotificationsView from '@/features/notifications/components/NotificationsView';
import Modal from '@/shared/components/ui/Modal';
import Sidebar, { type MenuItem } from '@/shared/components/layout/Sidebar';
import OrderList from '../../buyer/components/OrderList';
import MeetingRequests from '../components/MeetingRequests';

/** Approved but hidden from the marketplace because the wallet couldn't cover its ₹10 listing fee. */
const isBlocked = (p: any) =>
  p.status === 'APPROVED' && p.listingStatus === 'blocked_insufficient_balance';


const SupplierDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { profile } = useAppSelector(state => state.supplier);
  const { user } = useAppSelector(state => state.auth);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [rejectionReasonModal, setRejectionReasonModal] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeView = (searchParams.get('tab') as any) || 'overview';
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth > 1024);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 1024);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<any>(null);
  const [showUnpublishModal, setShowUnpublishModal] = useState(false);
  const [productToUnpublish, setProductToUnpublish] = useState<any>(null);
  const [msgModal, setMsgModal] = useState<{ isOpen: boolean; type: 'success' | 'error'; title: string; message: string }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });
  const [previousTab, setPreviousTab] = useState('overview');
  const [emailVerifySent, setEmailVerifySent] = useState(false);
  const [emailVerifySending, setEmailVerifySending] = useState(false);
  const [emailVerifySentTo, setEmailVerifySentTo] = useState('');

  const { data: unreadEnquiries = 0 } = useQuery<number>({
    queryKey: ['chat', 'unreadCount'],
    queryFn: () => chatApi.getUnreadCount(),
    refetchInterval: 30_000,
  });

  const setActiveView = (tab: string) => {
    setSearchParams({ tab });
    if (window.innerWidth <= 1024) setIsSidebarOpen(false);
    if (tab === 'enquiry') {
      queryClient.invalidateQueries({ queryKey: ['chat', 'unreadCount'] });
    }
  };

  useEffect(() => {
    const isMobileView = window.innerWidth <= 1024;
    const shouldLock = (isMobileView && isSidebarOpen) || showDeleteModal || showLogoutModal;
    if (shouldLock) { document.body.style.overflow = 'hidden'; document.body.style.position = 'fixed'; document.body.style.width = '100%'; }
    else { document.body.style.overflow = ''; document.body.style.position = ''; document.body.style.width = ''; }
    return () => { document.body.style.overflow = ''; document.body.style.position = ''; document.body.style.width = ''; };
  }, [isSidebarOpen, showDeleteModal, showLogoutModal]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (window.innerWidth > 1024) setIsSidebarOpen(true);
      else if (!isMobile) setIsSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  const isBetaActive =
    profile?.tier === 'BETA' &&
    profile?.subscription?.status === 'ACTIVE';

  const supplierMenu: MenuItem[] = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'My Products', icon: Package },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'partnerships', label: 'Reseller Partnerships', icon: Handshake },
    { id: 'enquiry', label: 'Enquiry', icon: MessageCircle, badge: unreadEnquiries || undefined },
    { id: 'quotations', label: 'Quotations', icon: FileText },
    { id: 'store', label: 'Front Store', icon: Store },
    { id: 'wallet',   label: 'Wallet',             icon: Wallet },
    { id: 'billing',  label: 'Billing Management',  icon: ReceiptText },
    { id: 'reports',  label: 'Reports',              icon: BarChart2 },
    { id: 'reviews', label: 'My Reviews', icon: Star },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
    ...(isBetaActive ? [{ id: 'meetings', label: 'Meeting Support', icon: Video }] : []),
  ];

  const fetchProducts = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const data = await productService.getMyProducts();
      const productList = data.products || data.data?.products || data || [];
      setProducts(Array.isArray(productList) ? productList : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load products. Please try again.');
      setProducts([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleAddProduct = () => { setPreviousTab(activeView); setActiveView('add-product'); };
  const handleEdit = (product: any) => { setPreviousTab(activeView); setEditingProduct(product); setActiveView('edit-product'); };
  const handleDelete = (product: any) => { setProductToDelete(product); setShowDeleteModal(true); };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await productService.deleteProduct(productToDelete.id || productToDelete._id);
      await fetchProducts();
      setShowDeleteModal(false); setProductToDelete(null);
    } catch {
      setShowDeleteModal(false); setProductToDelete(null);
      setMsgModal({
        isOpen: true,
        type: 'error',
        title: 'Delete Failed',
        message: 'Could not delete product. Please try again.'
      });
    }
  };

  const handleUnpublish = (product: any) => {
    setProductToUnpublish(product);
    setShowUnpublishModal(true);
  };

  const confirmUnpublish = async () => {
    if (!productToUnpublish) return;
    try {
      await productService.updateProduct(productToUnpublish.id || productToUnpublish._id, { status: 'DRAFT' });
      await fetchProducts();
      setShowUnpublishModal(false); setProductToUnpublish(null);
    } catch {
      setShowUnpublishModal(false); setProductToUnpublish(null);
      setMsgModal({
        isOpen: true,
        type: 'error',
        title: 'Unpublish Failed',
        message: 'Could not unpublish product. Please try again.'
      });
    }
  };

  const handleToggleLive = async (product: any) => {
    try {
      await productService.sellerToggleLive(product.id || product._id);
      await fetchProducts(false);
    } catch {
      setMsgModal({ isOpen: true, type: 'error', title: 'Action Failed', message: 'Could not update product visibility. Please try again.' });
    }
  };

  const handleLogout = () => setShowLogoutModal(true);
  const confirmLogout = () => { dispatch(logout()); window.location.href = '/'; };
  const isTrusted = products.filter(p => p.status === 'APPROVED').length >= 4;
  const handleFormSuccess = async () => { await fetchProducts(); setActiveView('inventory'); setEditingProduct(null); };

  const handleProductLiveUpdated = (updatedProduct: any) => {
    setProducts(prev => prev.map(p =>
      String(p._id || p.id) === String(updatedProduct._id || updatedProduct.id) ? updatedProduct : p
    ));
  };

  const renderProductListing = (productList: any[]) => {
    return <ProductTable products={productList} loading={loading} onEdit={handleEdit} onDelete={handleDelete} onAdd={handleAddProduct} onUnpublish={handleUnpublish} onViewReason={setRejectionReasonModal} onToggleLive={handleToggleLive} onRefresh={() => fetchProducts(false)} onProductLiveUpdated={handleProductLiveUpdated} />;
  };

  const modalContentCls = "text-center p-4";

  return (
    <div className="flex min-h-screen bg-white overflow-x-hidden w-full relative max-lg:flex-col">

      {/* ── Full-screen Enquiry overlay (hides sidebar completely) ── */}
      {activeView === 'enquiry' && (
        <div className="fixed inset-0 z-[1100] flex flex-col bg-white">
          {/* Enquiry top bar */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#f1f5f9] shrink-0 bg-white">
            <button
              onClick={() => setActiveView('overview')}
              aria-label="Back to dashboard"
              className="bg-[#f8fafc] border border-[#e2e8f0] text-[#475569] w-10 h-10 rounded-[10px] flex items-center justify-center cursor-pointer hover:bg-[#f1f5f9] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <span className="font-extrabold text-base text-[#0f172a]">Enquiries</span>
          </div>
          {/* Chat fills remaining height */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <ChatInbox />
          </div>
        </div>
      )}

      {/* ── Normal dashboard layout (non-enquiry views) ── */}
      <Sidebar
        title="Supplier Hub" logoSrc={logo}
        menu={supplierMenu}
        activeTab={activeView} onTabChange={id => setActiveView(id as any)}
        onLogout={handleLogout} isSidebarOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        brandColor="#e65c00" user={user || undefined} profile={profile || undefined}
      />

      <header className="hidden max-lg:flex sticky top-0 z-[100] bg-white px-4 py-3 border-b border-[#f1f5f9] items-center justify-between w-full shrink-0">
        <button onClick={() => setIsSidebarOpen(true)} aria-label="Open menu" className="bg-[#f8fafc] border border-[#e2e8f0] text-[#475569] w-10 h-10 rounded-[10px] flex items-center justify-center cursor-pointer">
          <Menu size={20} />
        </button>
        <div className="font-extrabold text-base text-[#0f172a]">Supplier Hub</div>
        <NotificationBell viewAllPath="/supplier/dashboard?tab=notifications" />
      </header>

      {isSidebarOpen && isMobile && (
        <div className="fixed inset-0 bg-[rgba(15,23,42,0.4)] backdrop-blur-[4px] z-[999] animate-fade-in" onClick={() => setIsSidebarOpen(false)} />
      )}

      <main className={`flex-1 transition-all duration-300 max-w-full overflow-x-hidden max-lg:ml-0 max-lg:p-4 max-lg:w-full ${isSidebarOpen ? 'ml-[280px]' : 'ml-24'} p-10`}>
        {/* Desktop top-right notification bell (mobile has it in the header) */}
        <div className="hidden lg:flex justify-end mb-4">
          <NotificationBell viewAllPath="/supplier/dashboard?tab=notifications" />
        </div>

        {error && (
          <div className="bg-[#fef2f2] border border-[#fecaca] p-4 rounded-[6px] flex items-center gap-3 text-[#b91c1c] text-[0.9rem] mb-6">
            <AlertCircle size={18} />
            <span>{error}</span>
            <button onClick={() => fetchProducts(true)} className="ml-auto bg-[#fecaca] border-none px-3 py-1.5 rounded-[6px] text-[#991b1b] font-bold cursor-pointer">Retry</button>
          </div>
        )}

        {/* Blocked-products (low wallet) banner */}
        {products.filter(isBlocked).length > 0 && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-[10px] bg-[#fef2f2] border border-[#fecaca] text-[#991b1b]">
            <Ban size={20} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-sm m-0">
                {products.filter(isBlocked).length} product{products.filter(isBlocked).length > 1 ? 's are' : ' is'} hidden from the marketplace — wallet balance too low
              </p>
              <p className="text-sm m-0 mt-0.5">Each live listing costs ₹10/month. Top up your wallet to bring {products.filter(isBlocked).length > 1 ? 'them' : 'it'} back live.</p>
            </div>
            <button onClick={() => setActiveView('wallet')} className="shrink-0 self-center px-4 py-2 bg-[#dc2626] text-white rounded-[8px] text-sm font-bold border-none cursor-pointer hover:bg-[#b91c1c]">
              Top Up Wallet
            </button>
          </div>
        )}

        {/* Unverified email banner */}
        {(() => {
          const supplierEmail = user?.email || (profile as any)?.user?.email || (profile as any)?.businessDetails?.email;
          const isVerified = user?.isEmailVerified || (profile as any)?.user?.isEmailVerified;
          if (!supplierEmail || isVerified) return null;
          const handleSendVerification = async () => {
            setEmailVerifySending(true);
            try {
              const result = await supplierService.sendVerificationEmail();
              setEmailVerifySentTo(result.sentTo || '');
              setEmailVerifySent(true);
            } catch (err: any) {
              toast.error(err?.response?.data?.message || 'Failed to send verification email');
            } finally {
              setEmailVerifySending(false);
            }
          };
          return (
            <div className="mb-6 flex items-start gap-3 p-4 rounded-[10px] bg-[#eff6ff] border border-[#bfdbfe] text-[#1e40af]">
              <MailWarning size={20} className="shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-sm m-0">Verify your email address</p>
                <p className="text-sm m-0 mt-0.5">
                  {emailVerifySent
                    ? <>Verification link sent to <span className="font-semibold">{emailVerifySentTo}</span>. Check your inbox and click the link to verify.</>
                    : <>Your email <span className="font-semibold">{supplierEmail}</span> is not verified yet. Verify to secure your account and receive important order updates.</>
                  }
                </p>
              </div>
              {!emailVerifySent && (
                <button
                  onClick={handleSendVerification}
                  disabled={emailVerifySending}
                  className="shrink-0 self-center px-4 py-2 bg-[#1d4ed8] text-white rounded-[8px] text-sm font-bold border-none cursor-pointer hover:bg-[#1e40af] disabled:opacity-60 whitespace-nowrap"
                >
                  {emailVerifySending ? 'Sending…' : 'Verify Email'}
                </button>
              )}
              {emailVerifySent && (
                <button
                  onClick={handleSendVerification}
                  disabled={emailVerifySending}
                  className="shrink-0 self-center px-4 py-2 bg-transparent text-[#1d4ed8] rounded-[8px] text-sm font-bold border border-[#bfdbfe] cursor-pointer hover:bg-[#eff6ff] disabled:opacity-60 whitespace-nowrap"
                >
                  Resend
                </button>
              )}
            </div>
          );
        })()}

        {/* 1-day-before membership expiry popup */}
        <MembershipRenewalAlert onRenew={() => setActiveView('settings')} />

        {/* Post-approval plan activation prompt (only shows when verified & plan not yet paid) */}
        <SubscriptionActivation />

        {activeView === 'overview' && <SupplierOverview profile={profile} products={products} isTrusted={isTrusted} handleRefresh={() => fetchProducts(true)} setActiveView={setActiveView} renderProductListing={renderProductListing} />}
        {activeView === 'inventory' && <SupplierInventory products={products} handleRefresh={() => fetchProducts(true)} onAddProduct={handleAddProduct} renderProductListing={renderProductListing} />}
        {activeView === 'orders' && <div className="p-5"><OrderList /></div>}
        {activeView === 'quotations' && <SupplierQuotations onGoToWallet={() => setActiveView('wallet')} />}
        {/* enquiry is rendered in the full-screen overlay above */}
        {activeView === 'store' && (profile?._id ? <SupplierStoreFront supplierId={profile._id} /> : <div className="flex items-center justify-center h-64 text-[#64748b]">Loading store…</div>)}
        {activeView === 'wallet'   && <SupplierWallet />}
        {activeView === 'billing'  && <BillingManagement setActiveView={setActiveView} />}
        {activeView === 'reports'  && <SupplierReports />}
        {activeView === 'partnerships' && <SupplierPartnerships />}
        {activeView === 'reviews' && <div className="p-5"><SupplierReviews /></div>}
        {activeView === 'settings' && <SupplierSettings profile={profile} />}
        {activeView === 'notifications' && <NotificationsView />}
        {activeView === 'upgrade-plan' && <MembershipUpgrade />}
        {activeView === 'meetings' && <MeetingRequests />}
        {(activeView === 'add-product' || activeView === 'edit-product') && (
          <div className="animate-fade-in -mt-4">
            <AddProductForm onBack={() => { setActiveView('inventory'); setEditingProduct(null); }} onSuccess={handleFormSuccess} editingProduct={editingProduct} returnTab={previousTab} />
          </div>
        )}
      </main>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Product">
        <div className={modalContentCls}>
          <div className="w-16 h-16 bg-[#fef2f2] text-[#dc2626] rounded-full flex items-center justify-center mx-auto mb-6"><Trash2 size={32} /></div>
          <h3>Delete this product?</h3>
          <p>Are you sure you want to remove <strong>{productToDelete?.name}</strong>? This action cannot be undone.</p>
          <div className="grid grid-cols-2 gap-4 mt-8">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button onClick={confirmDelete} className="!bg-[#dc2626]">Delete</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} title="Confirm Logout">
        <div className={modalContentCls}>
          <div className="w-16 h-16 bg-[#fef2f2] text-[#dc2626] rounded-full flex items-center justify-center mx-auto mb-6"><LogOut size={32} /></div>
          <h3>Are you sure?</h3>
          <p>You will need to login again to access your dashboard.</p>
          <div className="grid grid-cols-2 gap-4 mt-8">
            <Button variant="outline" onClick={() => setShowLogoutModal(false)}>Cancel</Button>
            <Button onClick={confirmLogout} className="!bg-[#dc2626]">Sign Out</Button>
          </div>
        </div>
      </Modal>
      <Modal isOpen={!!rejectionReasonModal} onClose={() => setRejectionReasonModal(null)} title="Reason for Rejection">
        <div className={modalContentCls}>
          <div className="w-16 h-16 bg-[#fef2f2] text-[#dc2626] rounded-full flex items-center justify-center mx-auto mb-6"><AlertCircle size={32} /></div>
          <h3>Product Rejected</h3>
          <p className="text-sm text-[#475569] mb-4 text-left">Your product was rejected for the following reason:</p>
          <div className="p-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] text-[#0f172a] text-sm whitespace-pre-wrap leading-relaxed text-left">
            {rejectionReasonModal}
          </div>
          <div className="mt-8">
            <Button onClick={() => setRejectionReasonModal(null)} className="w-full">Understood</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showUnpublishModal} onClose={() => setShowUnpublishModal(false)} title="Unpublish Product">
        <div className={modalContentCls}>
          <div className="w-16 h-16 bg-[#fff7ed] text-[#d97706] rounded-full flex items-center justify-center mx-auto mb-6"><AlertCircle size={32} /></div>
          <h3>Unpublish this product?</h3>
          {productToUnpublish?.status === 'APPROVED' ? (
            <div className="mt-3 p-4 bg-[#fef2f2] border border-[#fecaca] rounded-[10px] text-left">
              <p className="text-sm text-[#b91c1c] m-0 font-bold">
                ⚠️ This product is already live!
              </p>
              <p className="text-xs text-[#dc2626] m-0 mt-2 leading-relaxed">
                If you proceed, this product will no longer be displayed or available on the live website to buyers.
              </p>
              <p className="text-[11px] text-[#7f1d1d] m-0 mt-2 font-medium italic">
                * This will not affect any ongoing enquiries or chats between you and buyers for this product.
              </p>
            </div>
          ) : (
            <p className="text-sm text-[#64748b]">
              Are you sure you want to withdraw <strong>{productToUnpublish?.name}</strong> from review and move it back to your drafts?
            </p>
          )}
          <div className="grid grid-cols-2 gap-4 mt-8">
            <Button variant="outline" onClick={() => setShowUnpublishModal(false)}>Cancel</Button>
            <Button onClick={confirmUnpublish} className="!bg-[#d97706] text-white">Confirm Unpublish</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={msgModal.isOpen} onClose={() => setMsgModal(prev => ({ ...prev, isOpen: false }))} title={msgModal.title}>
        <div className={modalContentCls}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
            msgModal.type === 'error' ? 'bg-[#fef2f2] text-[#dc2626]' : 'bg-[#ecfdf5] text-[#059669]'
          }`}>
            {msgModal.type === 'error' ? <AlertCircle size={32} /> : <CheckCircle size={32} />}
          </div>
          <h3>{msgModal.title}</h3>
          <p className="text-sm text-[#64748b] mt-2">{msgModal.message}</p>
          <div className="mt-8">
            <Button onClick={() => setMsgModal(prev => ({ ...prev, isOpen: false }))} className="w-full">
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SupplierDashboard;
