import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logout } from '@/features/auth/store/auth.slice';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import productService from '@/features/product/services/product.service';
import { chatApi } from '@/features/chat/services/chat.api';
import Button from '@/shared/components/ui/Button';
import {
  LayoutDashboard, Package, Truck, LogOut, Trash2, FileText, MessageCircle,
  Handshake, Menu, Edit, Image as ImageIcon, Layers, CheckCircle, Clock,
  AlertCircle, ShoppingBag, Settings as SettingsIcon, Wallet
} from 'lucide-react';

import ProductTable from '../components/ProductTable';
import PlaceholderView from '../components/PlaceholderView';
import AddProductForm from '../components/AddProductForm';
import SupplierPartnerships from '../components/SupplierPartnerships';
import SupplierOverview from '../components/SupplierOverview';
import SupplierInventory from '../components/SupplierInventory';
import SupplierSettings from '../components/SupplierSettings';
import SupplierWallet from '../components/SupplierWallet';
import ChatInbox from '@/features/chat/components/ChatInbox';
import SupplierQuotations from '../components/SupplierQuotations';
import Modal from '@/shared/components/ui/Modal';
import Sidebar, { type MenuItem } from '@/shared/components/layout/Sidebar';
import OrderList from '../../buyer/components/OrderList';

interface ProductGridProps {
  products: any[];
  loading: boolean;
  onEdit: (product: any) => void;
  onDelete: (product: any) => void;
  onAdd?: () => void;
}

const statusCls: Record<string, string> = {
  draft:    'bg-[#fef9c3] text-[#92400e]',
  approved: 'bg-[#ecfdf5] text-[#059669]',
  pending:  'bg-[#fff7ed] text-[#d97706]',
  rejected: 'bg-[#fef2f2] text-[#dc2626]',
};

const ProductGrid: React.FC<ProductGridProps> = ({ products, loading, onEdit, onDelete, onAdd }) => {
  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-3.5 p-3.5 bg-white border border-[#eef2f6] rounded-[8px] animate-pulse">
            <div className="w-[70px] h-[70px] rounded-[6px] bg-[#f1f5f9] shrink-0" />
            <div className="flex-1 flex flex-col gap-2 pt-1">
              <div className="h-4 bg-[#f1f5f9] rounded w-3/4" />
              <div className="h-3 bg-[#f1f5f9] rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-[#64748b]">
        <Package size={48} />
        <p>No products found. Start by adding your first product!</p>
        {onAdd && <Button onClick={onAdd}>+ Add Product</Button>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {products.map(product => {
        const status = product.status?.toLowerCase() || 'pending';
        return (
          <div key={product.id || product._id} className="bg-white border border-[#eef2f6] rounded-[8px] p-3.5 flex gap-3.5 items-center w-full transition-all active:bg-[#f8fafc] active:scale-[0.98]">
            <div className="w-[70px] h-[70px] rounded-[6px] overflow-hidden border border-[#f1f5f9] bg-[#f8fafc] shrink-0">
              {product.images?.[0] ? (
                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#94a3b8]"><ImageIcon size={24} /></div>
              )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <h3 className="text-[0.95rem] font-bold text-[#1e293b] m-0 truncate">{product.name}</h3>
              <div className="flex flex-col gap-1">
                <span className="font-extrabold text-[#0f172a] text-base">₹{product.basePrice?.toLocaleString()}</span>
                <span className="text-[#64748b] flex items-center gap-1 text-xs font-semibold"><Layers size={14} /> MOQ: {product.moq}</span>
              </div>
            </div>
            <div className="flex flex-col items-end justify-between gap-2 shrink-0">
              <div className={`text-[0.65rem] font-extrabold px-2 py-1 rounded-[6px] uppercase whitespace-nowrap flex items-center gap-1 ${statusCls[status] || statusCls.pending}`}>
                {status === 'approved' ? <CheckCircle size={14} /> : status === 'pending' ? <Clock size={14} /> : status === 'draft' ? <FileText size={14} /> : <AlertCircle size={14} />}
                {product.status || 'PENDING'}
              </div>
              <div className="flex gap-2">
                <button onClick={() => onEdit(product)} aria-label="Edit" className="w-[34px] h-[34px] flex items-center justify-center rounded-[10px] bg-[#f1f5f9] text-primary border border-[#e2e8f0] cursor-pointer transition-all hover:bg-primary hover:text-white">
                  <Edit size={16} />
                </button>
                <button onClick={() => onDelete(product)} aria-label="Delete" className="w-[34px] h-[34px] flex items-center justify-center rounded-[10px] bg-[#fef2f2] text-[#dc2626] border border-[#fee2e2] cursor-pointer transition-all hover:bg-[#dc2626] hover:text-white">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

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
  const [searchParams, setSearchParams] = useSearchParams();
  const activeView = (searchParams.get('tab') as any) || 'overview';
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth > 1024);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 1024);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<any>(null);
  const [previousTab, setPreviousTab] = useState('overview');

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

  const supplierMenu: MenuItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'inventory', label: 'My Products', icon: Package },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'partnerships', label: 'Reseller Partnerships', icon: Handshake },
    { id: 'enquiry', label: 'Enquiry', icon: MessageCircle, badge: unreadEnquiries || undefined },
    { id: 'quotations', label: 'Quotations', icon: FileText },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'logistics', label: 'Logistics', icon: Truck },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
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
    } catch { alert('Failed to delete product'); }
  };

  const handleLogout = () => setShowLogoutModal(true);
  const confirmLogout = () => { dispatch(logout()); window.location.href = '/'; };
  const isTrusted = products.filter(p => p.status === 'APPROVED').length >= 4;
  const handleFormSuccess = async () => { await fetchProducts(); setActiveView('inventory'); setEditingProduct(null); };

  const renderProductListing = (productList: any[]) => {
    if (isMobile) return <ProductGrid products={productList} loading={loading} onEdit={handleEdit} onDelete={handleDelete} onAdd={handleAddProduct} />;
    return <ProductTable products={productList} loading={loading} onEdit={handleEdit} onDelete={handleDelete} onAdd={handleAddProduct} />;
  };

  const modalContentCls = "text-center p-4";

  return (
    <div className="flex min-h-screen bg-white overflow-x-hidden w-full relative max-lg:flex-col">
      <Sidebar
        title="Supplier Hub" logoSrc="/favicon.jpeg"
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
        <div className="w-10" />
      </header>

      {isSidebarOpen && isMobile && (
        <div className="fixed inset-0 bg-[rgba(15,23,42,0.4)] backdrop-blur-[4px] z-[999] animate-fade-in" onClick={() => setIsSidebarOpen(false)} />
      )}

      <main className={`flex-1 transition-all duration-300 max-w-full overflow-x-hidden max-lg:ml-0 max-lg:p-4 max-lg:w-full ${isSidebarOpen ? 'ml-[280px]' : 'ml-24'} ${activeView === 'enquiry' ? '!p-0' : 'p-10'}`}>
        {error && (
          <div className="bg-[#fef2f2] border border-[#fecaca] p-4 rounded-[6px] flex items-center gap-3 text-[#b91c1c] text-[0.9rem] mb-6">
            <AlertCircle size={18} />
            <span>{error}</span>
            <button onClick={() => fetchProducts(true)} className="ml-auto bg-[#fecaca] border-none px-3 py-1.5 rounded-[6px] text-[#991b1b] font-bold cursor-pointer">Retry</button>
          </div>
        )}

        {activeView === 'overview' && <SupplierOverview profile={profile} products={products} isTrusted={isTrusted} handleRefresh={() => fetchProducts(true)} setActiveView={setActiveView} renderProductListing={renderProductListing} />}
        {activeView === 'inventory' && <SupplierInventory products={products} handleRefresh={() => fetchProducts(true)} onAddProduct={handleAddProduct} renderProductListing={renderProductListing} />}
        {activeView === 'orders' && <div className="p-5"><OrderList /></div>}
        {activeView === 'quotations' && <SupplierQuotations onGoToWallet={() => setActiveView('wallet')} />}
        {activeView === 'enquiry' && <div className="h-screen max-lg:h-[calc(100vh-64px)] w-full"><ChatInbox /></div>}
        {activeView === 'wallet' && <SupplierWallet />}
        {activeView === 'logistics' && <PlaceholderView title="Logistics Tracking" icon={Truck} description="Manage your shipments and track delivery status for all your bulk orders." />}
        {activeView === 'partnerships' && <SupplierPartnerships />}
        {activeView === 'settings' && <SupplierSettings profile={profile} />}
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
    </div>
  );
};

export default SupplierDashboard;
