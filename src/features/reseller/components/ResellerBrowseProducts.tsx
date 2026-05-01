// ResellerBrowseProducts.tsx (unchanged, only CSS changes)
import React, { useState, useEffect } from 'react';
import { Search, Package, MapPin, Phone, Building, ExternalLink, CheckCircle, Truck, Shield } from 'lucide-react';
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
  const ITEMS_PER_PAGE = 16;
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
          <div className={styles.grid}>
            {paginatedProducts.map(product => {
              const status = requestStatuses[product._id];
              const supplier = product.supplierId || {};

              return (
                <div key={product._id} className={styles.card}>
                  <div className={styles.imageContainer}>
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} loading="lazy" />
                    ) : (
                      <div className={styles.placeholderImage}>
                        <Package size={48} strokeWidth={1} />
                      </div>
                    )}
                    <span className={styles.categoryBadge}>{product.category}</span>
                    {product.stock && product.stock > 0 && (
                      <span className={styles.stockBadge}>In Stock</span>
                    )}
                  </div>

                  <div className={styles.cardContent}>
                    <div className={styles.productHeader}>
                      <h3 className={styles.productName}>{product.name}</h3>
                      {supplier.isVerified && (
                        <span className={styles.verifiedBadge} title="Verified Supplier">
                          <Shield size={14} />
                        </span>
                      )}
                    </div>

                    <div className={styles.priceSection}>
                      <div className={styles.priceRow}>
                        <span className={styles.price}>₹{product.basePrice?.toLocaleString()}</span>
                        <span className={styles.unit}>/ {product.unit}</span>
                      </div>
                      <div className={styles.moq}>
                        <Truck size={12} />
                        <span>Min order: {product.moq} {product.unit}</span>
                      </div>
                    </div>

                    <div className={styles.supplierDetails}>
                      <div className={styles.supplierHeader}>
                        <Building size={14} />
                        <h4>Supplier</h4>
                      </div>
                      <div className={styles.supplierInfo}>
                        <p className={styles.businessName}>
                          {supplier.businessName || 'Verified Supplier'}
                        </p>
                        {supplier.businessDetails?.city && (
                          <div className={styles.supplierInfoRow}>
                            <MapPin size={12} />
                            <span>{supplier.businessDetails.city}, {supplier.businessDetails.state}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={styles.cardFooter}>
                    {status === 'APPROVED' ? (
                      <Button variant="outline" className={styles.approvedBtn} disabled>
                        <CheckCircle size={16} /> Added to Store
                      </Button>
                    ) : status === 'PENDING' ? (
                      <Button variant="outline" className={styles.requestedBtn} disabled>
                        <CheckCircle size={16} /> Request Sent
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleRequestClick(product)}
                        disabled={requestingId === product._id}
                        className={styles.requestBtn}
                      >
                        {requestingId === product._id ? 'Sending...' : 'Request to Add'}
                        <ExternalLink size={16} />
                      </Button>
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