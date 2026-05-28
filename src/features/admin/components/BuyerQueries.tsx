import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import adminService from '@/features/admin/services/admin.service';

interface Reply {
  sender: 'admin' | 'buyer';
  message: string;
  createdAt: string;
}

interface ComposeState {
  to: string;
  subject: string;
  body: string;
}

interface Ticket {
  id: string;
  ticketId: string;
  buyerName: string;
  buyerEmail?: string;
  phone: string;
  subject: string;
  issueType: string;
  message: string;
  priority: string;
  status: string;
  createdAt: string;
  attachmentUrl?: string;
  replies: Reply[];
}

interface ApiTicket {
  _id: string;
  ticketId: string;
  buyerName: string;
  buyerEmail?: string;
  phone: string;
  subject: string;
  issueType: string;
  message: string;
  priority: string;
  status: string;
  createdAt: string;
  attachmentUrl?: string;
  replies?: Reply[];
}

const BuyerQueries: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [compose, setCompose] = useState<ComposeState | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);


  const openCompose = (ticket: Ticket) => {
    const subject = `Regarding your Ticket ${ticket.ticketId} — ${ticket.subject}`;
    const body = `Hello ${ticket.buyerName},\n\nThank you for contacting us regarding your ticket (${ticket.ticketId}) for "${ticket.subject}".\n\n[Write your message here]\n\nBest regards,\nAMJSTAR Team`;
    setCompose({ to: ticket.buyerEmail || '', subject, body });
  };

  const fetchTickets = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const ticketsData: ApiTicket[] = await adminService.getTickets();
      const mapped: Ticket[] = (ticketsData || []).map((t) => ({
        id: t._id,
        ticketId: t.ticketId,
        buyerName: t.buyerName,
        buyerEmail: t.buyerEmail,
        phone: t.phone,
        subject: t.subject,
        issueType: t.issueType,
        message: t.message,
        priority: t.priority,
        status: t.status,
        createdAt: t.createdAt,
        attachmentUrl: t.attachmentUrl,
        replies: t.replies || []
      }));
      setTickets(mapped);
      setSelected(prev => (prev ? mapped.find(tk => tk.id === prev.id) || prev : prev));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load buyer queries');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => fetchTickets());
  }, [fetchTickets]);



  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      await adminService.updateTicketStatus(ticketId, newStatus);
      toast.success('Status updated successfully');
      await fetchTickets(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    }
  };

  const handleSendEmail = async () => {
    if (!selected || !compose) return;
    if (!compose.to.trim()) {
      toast.error('Buyer email is missing');
      return;
    }
    if (!compose.body.trim()) {
      toast.error('Email body is required');
      return;
    }

    setSendingEmail(true);
    try {
      const result = await adminService.replyToTicket(selected.id, compose.body, true, compose.subject);
      if (result.emailSent) {
        toast.success(`Email sent to ${compose.to}`);
      } else if (result.emailError) {
        toast.error(`Email failed: ${result.emailError}`);
      } else {
        toast.success('Reply recorded (email may be delayed)');
      }
      setCompose(null);
      await fetchTickets(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-sm text-[#64748b] animate-pulse">Loading buyer queries...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-extrabold text-[#0f172a] m-0">Buyer Queries</h3>
        <button
          onClick={() => fetchTickets(true)}
          className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[6px] border-none cursor-pointer transition-colors"
        >
          Refresh
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ticket List Panel */}
        <div className="bg-white border border-[#eef2f6] rounded-[12px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col">
          <h4 className="font-bold text-sm text-[#0f172a] m-0 mb-3 uppercase tracking-wider text-[#64748b]">Ticket List</h4>
          {tickets.length === 0 ? (
            <div className="p-8 text-center bg-slate-50/50 rounded-[8px] border border-dashed border-[#e2e8f0]">
              <p className="text-sm text-[#64748b] m-0 font-medium">No Buyer Queries Found</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[500px] pr-1">
              <ul className="divide-y divide-[#f1f5f9] p-0 m-0 list-none">
                {tickets.map(t => (
                  <li
                    key={t.id}
                    className={`p-3.5 cursor-pointer hover:bg-[#f8fafc] transition-colors rounded-[8px] mb-1 list-none ${selected?.id === t.id ? 'bg-[#f0f9ff]' : ''}`}
                    onClick={() => setSelected(t)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] font-extrabold text-[#475569] tracking-wide">{t.ticketId || 'TKT-NEW'}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-[4px] font-extrabold uppercase ${t.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          t.status === 'closed' ? 'bg-slate-50 text-slate-600 border border-slate-100' :
                            t.status === 'open' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                              'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>{t.status}</span>
                    </div>
                    <div className="font-bold text-sm text-[#1e293b] truncate mb-1.5">{t.subject}</div>
                    <div className="flex justify-between text-xs text-[#64748b]">
                      <span className="font-medium">{t.buyerName}</span>
                      <span>{new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Ticket Details Panel */}
        <div className="bg-white border border-[#eef2f6] rounded-[12px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          {selected ? (
            <div className="flex flex-col h-full">
              <h4 className="font-bold text-sm text-[#0f172a] m-0 mb-4 border-b border-[#f1f5f9] pb-3 flex justify-between items-center">
                <span>Ticket Details</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openCompose(selected)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-primary text-primary hover:bg-[#f4f3ff] text-xs font-bold rounded-[8px] cursor-pointer transition-all bg-transparent outline-none"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Mail Buyer
                  </button>
                  <span className="text-xs font-mono text-[#64748b] bg-slate-100 px-2 py-0.5 rounded">{selected.ticketId}</span>
                </div>
              </h4>
              <div className="space-y-3.5 text-sm text-[#334155] flex-1">
                <div>
                  <span className="font-bold text-[#64748b] block text-[10px] uppercase tracking-wider mb-0.5">Buyer Name</span>
                  <div className="font-semibold text-[#1e293b]">{selected.buyerName}</div>
                  {selected.buyerEmail && (
                    <div className="text-xs text-[#64748b] font-medium mt-0.5">{selected.buyerEmail}</div>
                  )}
                </div>
                <div>
                  <span className="font-bold text-[#64748b] block text-[10px] uppercase tracking-wider mb-0.5">Phone Number</span>
                  <div className="font-semibold text-[#1e293b]">{selected.phone}</div>
                </div>
                <div>
                  <span className="font-bold text-[#64748b] block text-[10px] uppercase tracking-wider mb-0.5">Subject</span>
                  <div className="font-semibold text-[#1e293b]">{selected.subject}</div>
                </div>
                <div>
                  <span className="font-bold text-[#64748b] block text-[10px] uppercase tracking-wider mb-0.5">Issue Type</span>
                  <div className="font-semibold text-[#1e293b]">{selected.issueType}</div>
                </div>
                <div>
                  <span className="font-bold text-[#64748b] block text-[10px] uppercase tracking-wider mb-0.5">Message</span>
                  <div className="text-[#334155] bg-slate-50 p-3 rounded-[8px] border border-[#f1f5f9] leading-relaxed whitespace-pre-wrap">{selected.message}</div>
                </div>
                <div className="flex gap-4">
                  <div>
                    <span className="font-bold text-[#64748b] block text-[10px] uppercase tracking-wider mb-1">Priority</span>
                    <span className={`inline-block px-2.5 py-0.5 text-xs rounded-[4px] font-bold ${selected.priority === 'High' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                        selected.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          'bg-slate-50 text-slate-700 border border-slate-200'
                      }`}>{selected.priority}</span>
                  </div>
                  {selected.attachmentUrl && (
                    <div>
                      <span className="font-bold text-[#64748b] block text-[10px] uppercase tracking-wider mb-1">Attachment</span>
                      <a
                        href={selected.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary font-bold hover:underline bg-[#f4f3ff] px-2 py-0.5 rounded border border-[#e2dfff]"
                      >
                        View Attachment
                      </a>
                    </div>
                  )}
                </div>

                {/* Status Section */}
                <div className="border-t border-b border-[#f1f5f9] py-3 my-4 flex items-center justify-between bg-slate-50/50 -mx-5 px-5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#64748b] text-[10px] uppercase tracking-wider">Current Status</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-[4px] font-extrabold uppercase ${selected.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        selected.status === 'closed' ? 'bg-slate-50 text-slate-600 border border-slate-100' :
                          selected.status === 'open' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                            'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>{selected.status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#64748b] text-[10px] uppercase tracking-wider">Update</span>
                    <select
                      value={selected.status}
                      onChange={(e) => handleStatusChange(selected.id, e.target.value)}
                      className="border border-[#e2e8f0] rounded-[6px] px-2 py-1 text-xs bg-white text-[#1e293b] focus:border-primary outline-none font-bold"
                    >
                      <option value="pending">Pending</option>
                      <option value="open">Open</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>


              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-8 bg-slate-50/50 border border-dashed border-[#e2e8f0] rounded-[12px]">
              <p className="text-sm text-[#64748b] m-0 font-medium">Select a ticket to view details.</p>
            </div>
          )}
        </div>
      </div>

      {/* Compose Email Modal */}
      {compose && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col text-left">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 m-0">
                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Compose Email
              </h3>
              <button onClick={() => setCompose(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg cursor-pointer border-none bg-transparent">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">To</label>
                <input
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors text-slate-800 font-semibold"
                  value={compose.to}
                  onChange={e => setCompose(prev => prev ? { ...prev, to: e.target.value } : prev)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Subject</label>
                <input
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors text-slate-800 font-semibold"
                  value={compose.subject}
                  onChange={e => setCompose(prev => prev ? { ...prev, subject: e.target.value } : prev)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Body</label>
                <textarea
                  rows={9}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors resize-none text-slate-700 leading-relaxed"
                  value={compose.body}
                  onChange={e => setCompose(prev => prev ? { ...prev, body: e.target.value } : prev)}
                />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:bg-blue-300 transition-colors border-none cursor-pointer disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-1.5"
                disabled={sendingEmail}
                onClick={handleSendEmail}
              >
                {sendingEmail ? 'Sending...' : 'Send Email'}
              </button>
              <button
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors border-none cursor-pointer flex items-center justify-center gap-1.5"
                onClick={() => {
                  navigator.clipboard.writeText(`To: ${compose.to}\nSubject: ${compose.subject}\n\n${compose.body}`);
                  toast.success('Email content copied!');
                }}
              >
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerQueries;
