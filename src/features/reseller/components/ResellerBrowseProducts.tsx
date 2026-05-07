// ResellerBrowseProducts.tsx (unchanged, only CSS changes)
import React, { useState, useEffect } from 'react';
import { Search, Package, MapPin, Phone, ExternalLink, CheckCircle, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/shared/components/ui/Button';
import apiClient from '@/api/client';
import resellerService from '../services/reseller.service';
import Modal from '@/shared/components/ui/Modal';
import Pagination from '@/shared/components/ui/Pagination';
import styles from './ResellerBrowseProducts.module.css';

const ResellerBrowseProducts: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [requestStatuses, setRequestStatuses] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchMyRequests();
  }, []);

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
      data.requests.forEach((req: any) => {
        const prodId = req.product._id || req.product;
        statuses[prodId] = req.status;
      });
      setRequestStatuses(statuses);
    } catch (err) {
      console.error('Failed to fetch requests', err);
    }
  };

  const handleRequestClick = (product: any) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

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

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination Logic
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;
  const totalItems = filteredProducts.length;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h2>Discover Products</h2>
          <p>Browse high-quality products from verified suppliers and request to add them to your storefront.</p>
        </div>
        <div className={styles.searchBar}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by product name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading product catalog...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className={styles.emptyState}>
          <Package size={56} strokeWidth={1.5} />
          <h3>No products found</h3>
          <p>Try adjusting your search criteria or explore different categories.</p>
        </div>
      ) : (
        <>
          <div className={styles.tableCard}>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Min. Order</th>
                    <th>Supplier</th>
                    <th className={styles.textRight}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map(product => {
                    const status = requestStatuses[product._id];
                    const supplier = product.supplierId || {};

                    return (
                      <tr key={product._id} className={styles.tableRow}>
                        <td>
                          <div className={styles.productCell}>
                            <div className={styles.productImgWrapper}>
                              {product.images?.[0] ? (
                                <img src={product.images[0]} alt={product.name} />
                              ) : (
                                <Package size={20} className={styles.placeholderIcon} />
                              )}
                            </div>
                            <div className={styles.productInfo}>
                              <span className={styles.name}>{product.name}</span>
                              {supplier.isVerified && (
                                <span className={styles.verifiedTag}>
                                  <Shield size={10} /> Verified
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={styles.categoryTag}>{product.category}</span>
                        </td>
                        <td>
                          <div className={styles.priceCell}>
                            <span className={styles.price}>₹{product.basePrice?.toLocaleString()}</span>
                            <span className={styles.unit}>/ {product.unit}</span>
                          </div>
                        </td>
                        <td>
                          <span className={styles.moqText}>{product.moq} {product.unit}</span>
                        </td>
                        <td>
                          <div className={styles.supplierCell}>
                            <span className={styles.supplierName}>{supplier.businessName || 'Verified Supplier'}</span>
                            <span className={styles.supplierLoc}>
                              <MapPin size={10} /> {supplier.businessDetails?.city || 'India'}
                            </span>
                          </div>
                        </td>
                        <td className={styles.textRight}>
                          {status === 'APPROVED' ? (
                            <span className={styles.statusBadgeApproved}>
                              <CheckCircle size={14} /> Added
                            </span>
                          ) : status === 'PENDING' ? (
                            <span className={styles.statusBadgePending}>
                              <CheckCircle size={14} /> Pending
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleRequestClick(product)}
                              disabled={requestingId === product._id}
                              className={styles.actionBtn}
                            >
                              {requestingId === product._id ? '...' : 'Request'}
                              <ExternalLink size={14} />
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

          <div className={styles.mobileGrid}>
            {paginatedProducts.map(product => {
              const status = requestStatuses[product._id];
              const supplier = product.supplierId || {};

              return (
                <div key={product._id} className={styles.mobileCard}>
                  <div className={styles.mobileCardHeader}>
                    <div className={styles.mobileCardImg}>
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.name} />
                      ) : (
                        <Package size={24} />
                      )}
                    </div>
                    <div className={styles.mobileCardTitle}>
                      <h4>{product.name}</h4>
                      <span className={styles.mobileCategory}>{product.category}</span>
                    </div>
                  </div>
                  
                  <div className={styles.mobileCardBody}>
                    <div className={styles.mobileInfoRow}>
                      <span className={styles.mobileLabel}>Price</span>
                      <span className={styles.mobilePrice}>₹{product.basePrice?.toLocaleString()} <small>/ {product.unit}</small></span>
                    </div>
                    <div className={styles.mobileInfoRow}>
                      <span className={styles.mobileLabel}>Min Order</span>
                      <span className={styles.mobileMoq}>{product.moq} {product.unit}</span>
                    </div>
                    <div className={styles.mobileInfoRow}>
                      <span className={styles.mobileLabel}>Supplier</span>
                      <span className={styles.mobileSupplier}>{supplier.businessName || 'Verified'}</span>
                    </div>
                  </div>

                  <div className={styles.mobileCardFooter}>
                    {status === 'APPROVED' ? (
                      <span className={styles.mobileStatusApproved}><CheckCircle size={14} /> Added</span>
                    ) : status === 'PENDING' ? (
                      <span className={styles.mobileStatusPending}><CheckCircle size={14} /> Pending</span>
                    ) : (
                      <button 
                        className={styles.mobileRequestBtn}
                        onClick={() => handleRequestClick(product)}
                        disabled={requestingId === product._id}
                      >
                        {requestingId === product._id ? 'Processing...' : 'Request to Add'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination 
            totalItems={totalItems}
            itemsPerPage={ITEMS_PER_PAGE}
            currentPage={currentPage}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            styles={styles}
          />
        </>
      )}

      {selectedProduct && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Confirm Supplier Partnership"
        >
          <div className={styles.modalContent}>
            <div className={styles.modalProductInfo}>
              <h4>Product Details</h4>
              <p>
                <strong>{selectedProduct.name}</strong> - ₹{selectedProduct.basePrice}/{selectedProduct.unit}
              </p>
              <p className={styles.modalMoq}>
                Minimum Order Quantity: {selectedProduct.moq} {selectedProduct.unit}
              </p>
            </div>

            <div className={styles.modalSupplierDetails}>
              <h4>Supplier Information</h4>
              <div className={styles.supplierInfoGrid}>
                <p><strong>Business Name:</strong> {selectedProduct.supplierId?.businessName || 'Verified Supplier'}</p>
                <p><strong>Contact Person:</strong> {selectedProduct.supplierId?.userId?.name || 'Supplier Representative'}</p>
                <p><strong>Phone:</strong> {selectedProduct.supplierId?.phone || 'Not provided'}</p>
                <p><strong>Email:</strong> {selectedProduct.supplierId?.userId?.email || 'Not available'}</p>
              </div>
            </div>

            <div className={styles.modalActions}>
              {selectedProduct.supplierId?.phone && (
                <a
                  href={`tel:${selectedProduct.supplierId.phone}`}
                  className={`${styles.modalBtn} ${styles.callBtn}`}
                >
                  <Phone size={16} /> Call Supplier
                </a>
              )}
              <Button onClick={confirmRequest} className={styles.modalBtn} variant="primary">
                Send Request
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ResellerBrowseProducts;