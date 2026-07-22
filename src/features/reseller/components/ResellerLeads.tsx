import React, { useState } from 'react';
import { Search, Filter, MessageCircle, Mail, Phone, MoreVertical, CheckCircle2, Clock, XCircle, ArrowRight, Users } from 'lucide-react';
import Button from '@/shared/components/ui/Button';

interface Lead {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  productName: string;
  productImage?: string;
  date: string;
  status: 'new' | 'contacted' | 'converted' | 'lost';
  notes?: string;
}

// Dummy data for leads
const DUMMY_LEADS: Lead[] = [
  {
    id: 'L-1001',
    customerName: 'Rahul Verma',
    phone: '+91 9876543210',
    email: 'rahul.v@example.com',
    productName: 'Premium Cotton Bedsheet Set',
    date: '2026-07-20T10:30:00Z',
    status: 'new',
  },
  {
    id: 'L-1002',
    customerName: 'Priya Sharma',
    phone: '+91 9876543211',
    email: 'priya.s@example.com',
    productName: 'Handcrafted Wooden Vase',
    date: '2026-07-19T14:15:00Z',
    status: 'contacted',
    notes: 'Asked for bulk pricing on 50 units. Sent quotation.',
  },
  {
    id: 'L-1003',
    customerName: 'Amit Singh',
    phone: '+91 9876543212',
    email: 'amit.s@example.com',
    productName: 'Organic Green Tea (Bulk)',
    date: '2026-07-18T09:45:00Z',
    status: 'converted',
  },
  {
    id: 'L-1004',
    customerName: 'Neha Gupta',
    phone: '+91 9876543213',
    email: 'neha.g@example.com',
    productName: 'Designer Ceramic Plates',
    date: '2026-07-15T16:20:00Z',
    status: 'lost',
    notes: 'Price was out of budget for the customer.',
  }
];

const statusStyles = {
  new: 'bg-blue-50 text-blue-700 border-blue-200',
  contacted: 'bg-amber-50 text-amber-700 border-amber-200',
  converted: 'bg-green-50 text-green-700 border-green-200',
  lost: 'bg-red-50 text-red-700 border-red-200',
};

const statusIcons = {
  new: <Clock size={14} />,
  contacted: <MessageCircle size={14} />,
  converted: <CheckCircle2 size={14} />,
  lost: <XCircle size={14} />,
};

const ResellerLeads: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>(DUMMY_LEADS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          lead.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lead.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const updateLeadStatus = (id: string, newStatus: Lead['status']) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center max-sm:flex-col max-sm:items-start max-sm:gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0f172a] m-0 mb-1">Leads Management</h2>
          <p className="text-sm text-[#64748b] m-0">Track and manage potential buyer inquiries from your storefront.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-10 pr-8 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
            </select>
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
        {[
          { label: 'Total Leads', count: leads.length, color: 'bg-gray-100 text-gray-800' },
          { label: 'New Inquiries', count: leads.filter(l => l.status === 'new').length, color: 'bg-blue-100 text-blue-800' },
          { label: 'In Discussion', count: leads.filter(l => l.status === 'contacted').length, color: 'bg-amber-100 text-amber-800' },
          { label: 'Converted', count: leads.filter(l => l.status === 'converted').length, color: 'bg-green-100 text-green-800' },
        ].map(stat => (
          <div key={stat.label} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{stat.label}</p>
              <p className="text-2xl font-extrabold text-gray-900">{stat.count}</p>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stat.color}`}>
              {stat.label === 'Converted' ? <CheckCircle2 size={20} /> : stat.label === 'In Discussion' ? <MessageCircle size={20} /> : stat.label === 'New Inquiries' ? <Clock size={20} /> : <Users size={20} />}
            </div>
          </div>
        ))}
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Customer Details</th>
                <th className="px-6 py-4">Product Inquiry</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 align-top">
                      <div className="font-bold text-gray-900">{lead.customerName}</div>
                      <div className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                        <Phone size={12} /> {lead.phone}
                      </div>
                      <div className="text-gray-500 text-xs mt-0.5 flex items-center gap-1">
                        <Mail size={12} /> {lead.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="font-semibold text-gray-800">{lead.productName}</div>
                      {lead.notes && (
                        <div className="text-xs text-gray-500 mt-2 bg-gray-100 p-2 rounded border border-gray-200 italic line-clamp-2">
                          "{lead.notes}"
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${statusStyles[lead.status]}`}>
                        {statusIcons[lead.status]} {lead.status}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top text-gray-500 whitespace-nowrap">
                      {new Date(lead.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 align-top text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a 
                          href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=Hi ${lead.customerName}, this is regarding your inquiry for ${lead.productName} on my AMJSTAR Store.`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors tooltip-trigger relative"
                          title="WhatsApp"
                        >
                          <MessageCircle size={16} />
                        </a>
                        <div className="relative group/menu">
                          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <MoreVertical size={16} />
                          </button>
                          <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10 py-1">
                            {lead.status !== 'contacted' && (
                              <button onClick={() => updateLeadStatus(lead.id, 'contacted')} className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 text-gray-700">Mark Contacted</button>
                            )}
                            {lead.status !== 'converted' && (
                              <button onClick={() => updateLeadStatus(lead.id, 'converted')} className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 text-green-600 font-medium">Mark Converted</button>
                            )}
                            {lead.status !== 'lost' && (
                              <button onClick={() => updateLeadStatus(lead.id, 'lost')} className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 text-red-600">Mark Lost</button>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-3">
                      <Users size={32} className="text-gray-300" />
                      <p>No leads found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ResellerLeads;
