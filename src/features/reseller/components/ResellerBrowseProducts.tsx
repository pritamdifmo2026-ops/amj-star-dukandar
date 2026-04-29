import React, { useState, useEffect } from 'react';
import { Search, Package, MapPin, Phone, Building, ExternalLink, CheckCircle } from 'lucide-react';
import Button from '@/shared/components/ui/Button';
import apiClient from '@/api/client';
import resellerService from '../services/reseller.service';
import Modal from '@/shared/components/ui/Modal';
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
      alert('Request sent to supplier successfully!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to send request');
    } finally {
      setRequestingId(null);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h2>Product Catalog</h2>
          <p>Browse products from verified suppliers and request to add them to your storefront.</p>
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
        <div className={styles.loading}>Loading catalog...</div>
      ) : filteredProducts.length === 0 ? (
        <div className={styles.emptyState}>
          <Package size={48} />
          <h3>No products found</h3>
          <p>Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredProducts.map(product => {
            const status = requestStatuses[product._id];
            const supplier = product.supplierId || {};
            
            return (
              <div key={product._id} className={styles.card}>
                <div className={styles.imageContainer}>
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} />
                  ) : (
                    <div className={styles.placeholderImage}><Package size={40} /></div>
                  )}
                  <span className={styles.categoryBadge}>{product.category}</span>
                </div>
                
                <div className={styles.cardContent}>
                  <h3 className={styles.productName}>{product.name}</h3>
                  <div className={styles.priceRow}>
                    <span className={styles.price}>₹{product.basePrice}</span>
                    <span className={styles.unit}>/ {product.unit}</span>
                  </div>
                  <div className={styles.moq}>Minimum Order: {product.moq} {product.unit}</div>
                  
                  <div className={styles.supplierDetails}>
                    <h4>Supplier Information</h4>
                    <div className={styles.supplierInfoRow}>
                      <Building size={14} />
                      <span>{supplier.businessName || 'Verified Supplier'}</span>
                    </div>
                    {supplier.phone && (
                      <div className={styles.supplierInfoRow}>
                        <Phone size={14} />
                        <span>{supplier.phone}</span>
                      </div>
                    )}
                    {supplier.businessDetails?.city && (
                      <div className={styles.supplierInfoRow}>
                        <MapPin size={14} />
                        <span>{supplier.businessDetails.city}, {supplier.businessDetails.state}</span>
                      </div>
                    )}
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
                      {requestingId === product._id ? 'Sending...' : 'Request to Add'} <ExternalLink size={16} />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedProduct && (
        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          title="Confirm Partnership Request"
        >
          <div className={styles.modalContent}>
            <p>You are requesting to add <strong>{selectedProduct.name}</strong> to your storefront.</p>
            
            <div className={styles.modalSupplierDetails}>
              <h4>Supplier Details</h4>
              <p><strong>Business Name:</strong> {selectedProduct.supplierId?.businessName}</p>
              <p><strong>Contact Person:</strong> {selectedProduct.supplierId?.userId?.name || 'Supplier'}</p>
              <p><strong>Phone:</strong> {selectedProduct.supplierId?.phone}</p>
              <p><strong>Email:</strong> {selectedProduct.supplierId?.userId?.email || 'N/A'}</p>
            </div>

            <div className={styles.modalActions}>
              <a 
                href={`tel:${selectedProduct.supplierId?.phone}`} 
                className={`${styles.modalBtn} ${styles.callBtn}`}
              >
                Call Supplier
              </a>
              <Button onClick={confirmRequest} className={styles.modalBtn}>
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
