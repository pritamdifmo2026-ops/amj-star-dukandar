import React, { useState, useEffect } from 'react';
import { Handshake, Search, Phone, Mail, Building } from 'lucide-react';
import resellerService from '../services/reseller.service';

const thCls = "text-left px-4 py-3.5 text-[#94a3b8] text-[0.7rem] font-extrabold uppercase tracking-[0.1em] border-b border-[#f1f5f9]";
const tdCls = "px-4 py-4 border-b border-[#f8fafc] text-sm text-[#334155]";

const ResellerSupplierPartners: React.FC = () => {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchPartners(); }, []);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const data = await resellerService.getRequests();
      const approved = data.requests.filter((r: any) => r.status === 'APPROVED');
      const supplierMap = new Map();
      approved.forEach((req: any) => {
        if (!supplierMap.has(req.supplier._id)) {
          supplierMap.set(req.supplier._id, { ...req.supplier, products: [req.product.name], joinedAt: req.respondedAt });
        } else {
          supplierMap.get(req.supplier._id).products.push(req.product.name);
        }
      });
      setPartners(Array.from(supplierMap.values()));
    } catch (err) { console.error('Failed to fetch supplier partners', err); }
    finally { setLoading(false); }
  };

  const filteredPartners = partners.filter(p =>
    p.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-start gap-4 mb-6 max-md:flex-col">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0f172a] m-0 mb-1">Supplier Partnerships</h2>
          <p className="text-sm text-[#64748b] m-0">View and manage your relationships with approved product suppliers.</p>
        </div>
        <div className="flex items-center gap-2 border border-[#e2e8f0] rounded-[10px] px-4 py-2.5 bg-white shadow-sm min-w-[240px] max-sm:min-w-0 max-sm:w-full focus-within:border-primary">
          <Search size={16} className="text-[#94a3b8] shrink-0" />
          <input className="border-none outline-none text-sm flex-1 bg-transparent text-[#1e293b] placeholder:text-[#94a3b8]" type="text" placeholder="Search suppliers..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-[#64748b]">Loading partners...</div>
      ) : filteredPartners.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-[#64748b]">
          <Handshake size={48} strokeWidth={1.5} />
          <h3 className="text-lg font-bold text-[#1e293b] m-0">No supplier partners yet</h3>
          <p className="text-sm m-0">{searchTerm ? 'Try adjusting your search.' : 'Approved suppliers will appear here once you request and get approved.'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-[10px] border border-[#eef2f6] shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Supplier', 'Contact Info', 'Approved Products', 'Partner Since', 'Actions'].map(h => (
                    <th key={h} className={thCls}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPartners.map(partner => (
                  <tr key={partner._id} className="hover:bg-[#fafbfc]">
                    <td className={tdCls}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#fff7ed] rounded-[8px] flex items-center justify-center text-primary shrink-0"><Building size={18} /></div>
                        <div>
                          <strong className="text-[#0f172a] block text-sm">{partner.businessName}</strong>
                          <p className="text-xs text-[#64748b] m-0">{partner.userId?.name || 'Authorized Supplier'}</p>
                        </div>
                      </div>
                    </td>
                    <td className={tdCls}>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 text-xs text-[#475569]"><Phone size={12} /> {partner.phone || 'N/A'}</div>
                        <div className="flex items-center gap-1.5 text-xs text-[#475569]"><Mail size={12} /> {partner.userId?.email || 'N/A'}</div>
                      </div>
                    </td>
                    <td className={tdCls}>
                      <div className="flex flex-wrap gap-1.5">
                        {partner.products.map((p: string, idx: number) => (
                          <span key={idx} className="text-[10px] bg-[#fff7ed] text-[#c2410c] border border-[#fed7aa] px-2 py-0.5 rounded-full font-semibold">{p}</span>
                        ))}
                      </div>
                    </td>
                    <td className={tdCls}>{new Date(partner.joinedAt).toLocaleDateString()}</td>
                    <td className={tdCls}>
                      <a href={`tel:${partner.phone}`} className="flex items-center gap-1.5 text-xs font-bold text-primary no-underline hover:underline">
                        <Phone size={13} /> Call Supplier
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResellerSupplierPartners;
