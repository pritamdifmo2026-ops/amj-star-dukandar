import React, { useState, useEffect } from 'react';
import { Search, Package, MapPin, Phone, ExternalLink, CheckCircle, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/shared/components/ui/Button';
import apiClient from '@/api/client';
import resellerService from '../services/reseller.service';
import Modal from '@/shared/components/ui/Modal';
import Pagination from '@/shared/components/ui/Pagination';

const thCls = "text-left px-4 py-3.5 text-[#94a3b8] text-[0.7rem] font-extrabold uppercase tracking-[0.1em] border-b border-[#f1f5f9]";
const tdCls = "px-4 py-4 border-b border-[#f8fafc] text-sm text-[#334155]";

const ResellerBrowseProducts: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [requestStatuses, setRequestStatuses] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  useEffect(() => { fetchProducts(); fetchMyRequests(); }, []);
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const fetchProducts = async () => {
    try {
      const response = await apiClient.get('/products');
      setProducts(response.data.products);
    } catch (err) {
      console.error('Failed to fetch public products', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRequests = async () => {
    try {
      const data = await resellerService.getRequests();
      const statuses: Record<string, string> = {};
      data.requests.forEach((req: any) => { const prodId = req.product._id || req.product; statuses[prodId] = req.status; });
      setRequestStatuses(statuses);
    } catch (err) { console.error('Failed to fetch requests', err); }
  };

  const handleRequestClick = (product: any) => { setSelectedProduct(product); setIsModalOpen(true); };

  const confirmRequest = async () => {
    if (!selectedProduct) return;
    const productId = selectedProduct._id;
    try {
      setRequestingId(productId);
      setIsModalOpen(false);
      await resellerService.requestProduct(productId);
      setRequestStatuses(prev => ({ ...prev, [productId]: 'PENDING' }));
      toast.success('Request sent to supplier successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send request');
    } finally {
      setRequestingId(null);
      setSelectedProduct(null);
    }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalItems = filteredProducts.length;
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'APPROVED') return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#ecfdf5] text-[#059669] text-xs font-bold rounded-full"><CheckCircle size={12} /> Added</span>;
    if (status === 'PENDING') return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#fff7ed] text-[#c2410c] text-xs font-bold rounded-full"><CheckCircle size={12} /> Pending</span>;
    return null;
  };

  return (
    <div>
      <div className="flex justify-between items-start gap-4 mb-6 max-md:flex-col">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0f172a] m-0 mb-1">Discover Products</h2>
          <p className="text-sm text-[#64748b] m-0">Browse high-quality products from verified suppliers and request to add them to your storefront.</p>
        </div>
        <div className="flex items-center gap-2 border border-[#e2e8f0] rounded-[10px] px-4 py-2.5 bg-white shadow-sm min-w-[280px] max-sm:min-w-0 max-sm:w-full focus-within:border-primary">
          <Search size={18} className="text-[#94a3b8] shrink-0" />
          <input className="border-none outline-none text-sm flex-1 bg-transparent text-[#1e293b] placeholder:text-[#94a3b8]" type="text" placeholder="Search by product name or category..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-[#64748b]">
          <div className="w-8 h-8 border-2 border-[#e2e8f0] border-t-primary rounded-full animate-spin" />
          <p className="text-sm">Loading product catalog...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-[#64748b]">
          <Package size={56} strokeWidth={1.5} />
          <h3 className="text-lg font-bold text-[#1e293b] m-0">No products found</h3>
          <p className="text-sm m-0">Try adjusting your search criteria or explore different categories.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="bg-white rounded-[10px] border border-[#eef2f6] shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden mb-5 max-md:hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {['Product', 'Category', 'Price', 'Min. Order', 'Supplier', 'Actions'].map(h => <th key={h} className={thCls}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map(product => {
                    const status = requestStatuses[product._id];
                    const supplier = product.supplierId || {};
                    return (
                      <tr key={product._id} className="hover:bg-[#fafbfc]">
                        <td className={tdCls}>
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-[8px] overflow-hidden border border-[#f1f5f9] bg-[#f8fafc] flex items-center justify-center shrink-0">
                              {product.images?.[0] ? <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" /> : <Package size={18} className="text-[#94a3b8]" />}
                            </div>
                            <div>
                              <span className="font-semibold text-[#0f172a] block">{product.name}</span>
                              {supplier.isVerified && <span className="inline-flex items-center gap-1 text-[10px] bg-[#eff6ff] text-[#1d4ed8] font-bold px-1.5 py-0.5 rounded-full mt-0.5"><Shield size={9} /> Verified</span>}
                            </div>
                          </div>
                        </td>
                        <td className={tdCls}><span className="bg-[#f1f5f9] text-[#475569] px-2.5 py-1 rounded-full text-xs font-semibold">{product.category}</span></td>
                        <td className={tdCls}>
                          <span className="font-bold text-[#0f172a]">₹{product.basePrice?.toLocaleString()}</span>
                          <span className="text-xs text-[#94a3b8] ml-1">/ {product.unit}</span>
                        </td>
                        <td className={tdCls}><span className="font-semibold">{product.moq} {product.unit}</span></td>
                        <td className={tdCls}>
                          <span className="font-semibold text-[#334155] block text-sm">{supplier.businessName || 'Verified Supplier'}</span>
                          <span className="flex items-center gap-1 text-xs text-[#94a3b8] mt-0.5"><MapPin size={10} /> {supplier.businessDetails?.city || 'India'}</span>
                        </td>
                        <td className={`${tdCls} text-right`}>
                          {status ? <StatusBadge status={status} /> : (
                            <Button size="sm" onClick={() => handleRequestClick(product)} disabled={requestingId === product._id} className="flex items-center gap-1.5">
                              {requestingId === product._id ? '...' : 'Request'} <ExternalLink size={13} />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="hidden max-md:flex flex-col gap-3 mb-5">
            {paginatedProducts.map(product => {
              const status = requestStatuses[product._id];
              const supplier = product.supplierId || {};
              return (
                <div key={product._id} className="bg-white border border-[#eef2f6] rounded-[10px] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-14 h-14 rounded-[8px] overflow-hidden border border-[#f1f5f9] bg-[#f8fafc] flex items-center justify-center shrink-0">
                      {product.images?.[0] ? <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" /> : <Package size={22} className="text-[#94a3b8]" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#0f172a] m-0 mb-0.5">{product.name}</h4>
                      <span className="text-xs bg-[#f1f5f9] text-[#475569] px-2 py-0.5 rounded-full font-semibold">{product.category}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 mb-3 text-xs">
                    <div className="flex justify-between"><span className="text-[#94a3b8]">Price</span><span className="font-bold text-primary">₹{product.basePrice?.toLocaleString()} <small className="text-[#94a3b8]">/ {product.unit}</small></span></div>
                    <div className="flex justify-between"><span className="text-[#94a3b8]">Min Order</span><span className="font-semibold">{product.moq} {product.unit}</span></div>
                    <div className="flex justify-between"><span className="text-[#94a3b8]">Supplier</span><span className="font-semibold">{supplier.businessName || 'Verified'}</span></div>
                  </div>
                  <div>
                    {status ? <StatusBadge status={status} /> : (
                      <button className="w-full py-2.5 bg-primary text-white font-bold text-sm rounded-[8px] border-none cursor-pointer hover:bg-primary-dark" onClick={() => handleRequestClick(product)} disabled={requestingId === product._id}>
                        {requestingId === product._id ? 'Processing...' : 'Request to Add'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination totalItems={totalItems} itemsPerPage={ITEMS_PER_PAGE} currentPage={currentPage} onPageChange={page => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
        </>
      )}

      {selectedProduct && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Confirm Supplier Partnership">
          <div className="p-4 flex flex-col gap-4">
            <div className="bg-[#f8fafc] rounded-[8px] p-4">
              <h4 className="text-sm font-bold text-[#0f172a] m-0 mb-2">Product Details</h4>
              <p className="text-sm text-[#475569] m-0"><strong>{selectedProduct.name}</strong> — ₹{selectedProduct.basePrice}/{selectedProduct.unit}</p>
              <p className="text-xs text-[#64748b] mt-1 m-0">Minimum Order Quantity: {selectedProduct.moq} {selectedProduct.unit}</p>
            </div>
            <div className="bg-[#f8fafc] rounded-[8px] p-4">
              <h4 className="text-sm font-bold text-[#0f172a] m-0 mb-2">Supplier Information</h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-[#475569]">
                <p className="m-0"><strong>Business:</strong> {selectedProduct.supplierId?.businessName || 'Verified Supplier'}</p>
                <p className="m-0"><strong>Contact:</strong> {selectedProduct.supplierId?.userId?.name || 'Supplier Representative'}</p>
                <p className="m-0"><strong>Phone:</strong> {selectedProduct.supplierId?.phone || 'Not provided'}</p>
                <p className="m-0"><strong>Email:</strong> {selectedProduct.supplierId?.userId?.email || 'Not available'}</p>
              </div>
            </div>
            <div className="flex gap-3">
              {selectedProduct.supplierId?.phone && (
                <a href={`tel:${selectedProduct.supplierId.phone}`} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#f8fafc] border border-[#e2e8f0] text-[#475569] rounded-[8px] no-underline font-semibold text-sm hover:bg-[#f1f5f9]">
                  <Phone size={16} /> Call Supplier
                </a>
              )}
              <Button onClick={confirmRequest} className="flex-1">Send Request</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ResellerBrowseProducts;
