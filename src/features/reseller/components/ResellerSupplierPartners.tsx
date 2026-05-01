import React, { useState, useEffect } from 'react';
import { Handshake, Search, Phone, Mail, Building } from 'lucide-react';
import resellerService from '../services/reseller.service';
import styles from './ResellerSupplierPartners.module.css';

const ResellerSupplierPartners: React.FC = () => {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const data = await resellerService.getRequests();
      // Filter for approved partnerships
      const approved = data.requests.filter((r: any) => r.status === 'APPROVED');
      
      // Group by supplier to avoid duplicates if multiple products from same supplier
      const supplierMap = new Map();
      approved.forEach((req: any) => {
        if (!supplierMap.has(req.supplier._id)) {
          supplierMap.set(req.supplier._id, {
            ...req.supplier,
            products: [req.product.name],
            joinedAt: req.respondedAt
          });
        } else {
          const s = supplierMap.get(req.supplier._id);
          s.products.push(req.product.name);
        }
      });

      setPartners(Array.from(supplierMap.values()));
    } catch (err) {
      console.error('Failed to fetch supplier partners', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPartners = partners.filter(p => 
    p.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h2>Supplier Partnerships</h2>
          <p>View and manage your relationships with approved product suppliers.</p>
        </div>
        <div className={styles.searchBar}>
          <Search size={20} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search suppliers..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      {loading ? (
        <div className={styles.loading}>Loading partners...</div>
      ) : filteredPartners.length === 0 ? (
        <div className={styles.emptyState}>
          <Handshake size={48} />
          <h3>No supplier partners yet</h3>
          <p>{searchTerm ? 'Try adjusting your search.' : 'Approved suppliers will appear here once you request and get approved.'}</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Contact Info</th>
                <th>Approved Products</th>
                <th>Partner Since</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPartners.map((partner) => (
                <tr key={partner._id}>
                  <td data-label="Supplier">
                    <div className={styles.supplierBrand}>
                      <div className={styles.brandIcon}><Building size={20}/></div>
                      <div>
                        <strong>{partner.businessName}</strong>
                        <p>{partner.userId?.name || 'Authorized Supplier'}</p>
                      </div>
                    </div>
                  </td>
                  <td data-label="Contact Info">
                    <div className={styles.contactInfo}>
                      <div className={styles.infoRow}><Phone size={14}/> {partner.phone}</div>
                      <div className={styles.infoRow}><Mail size={14}/> {partner.userId?.email || 'N/A'}</div>
                    </div>
                  </td>
                  <td data-label="Approved Products">
                    <div className={styles.productList}>
                      {partner.products.map((p: string, idx: number) => (
                        <span key={idx} className={styles.productBadge}>{p}</span>
                      ))}
                    </div>
                  </td>
                  <td data-label="Partner Since">{new Date(partner.joinedAt).toLocaleDateString()}</td>
                  <td data-label="Actions">
                    <a href={`tel:${partner.phone}`} className={styles.callLink}>
                      Call Supplier
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ResellerSupplierPartners;
