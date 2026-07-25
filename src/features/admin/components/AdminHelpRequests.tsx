import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Phone, Mail, MessageSquare, Clock, CheckCircle, Send, X, User } from 'lucide-react';
import adminService from '../services/admin.service';
import Button from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';
import toast from 'react-hot-toast';

const statusCls: Record<string, string> = {
  new: 'bg-[#fff7ed] text-[#c2410c] border-[#fed7aa]',
  read: 'bg-[#f1f5f9] text-[#475569] border-[#e2e8f0]',
  resolved: 'bg-[#ecfdf5] text-[#059669] border-[#6ee7b7]',
};

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'new') return <Clock size={12} />;
  if (status === 'resolved') return <CheckCircle size={12} />;
  return <MessageSquare size={12} />;
};

const AdminHelpRequests: React.FC = () => {
  const queryClient = useQueryClient();
  const [replyTarget, setReplyTarget] = useState<any | null>(null);
  const [replySubject, setReplySubject] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [sending, setSending] = useState(false);
  const [filterRole, setFilterRole] = useState<'all' | 'buyer' | 'supplier' | 'reseller'>('all');

  const { data: helpRequests = [], isLoading } = useQuery({
    queryKey: ['admin', 'helpRequests'],
    queryFn: () => adminService.getHelpRequests(),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => adminService.updateHelpRequestStatus(id, 'read'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'helpRequests'] }),
  });

  const markResolvedMutation = useMutation({
    mutationFn: (id: string) => adminService.updateHelpRequestStatus(id, 'resolved'),
    onSuccess: () => {
      toast.success('Marked as resolved');
      queryClient.invalidateQueries({ queryKey: ['admin', 'helpRequests'] });
    },
  });

  const openReply = (req: any) => {
    setReplyTarget(req);
    setReplySubject(`Re: ${req.subject}`);
    setReplyBody(`Hi ${req.name},\n\nThank you for reaching out to us.\n\n\n\nWarm regards,\nTeam AMJ Star`);
    if (req.status === 'new') markReadMutation.mutate(req._id);
  };

  const handleSendReply = async () => {
    if (!replyTarget || !replySubject.trim() || !replyBody.trim()) return;
    setSending(true);
    try {
      await adminService.replyToHelpRequest(replyTarget._id, replySubject, replyBody);
      queryClient.invalidateQueries({ queryKey: ['admin', 'helpRequests'] });
      toast.success('Reply sent successfully!');
      setReplyTarget(null);
    } catch {
      toast.error('Failed to send reply. Check SMTP settings.');
    } finally {
      setSending(false);
    }
  };

  const handleMarkRead = (req: any) => {
    if (req.status !== 'new') return;
    markReadMutation.mutate(req._id);
  };

  if (isLoading) return <div className="py-16 text-center text-sm text-[#64748b]">Loading help requests...</div>;

  const filteredRequests = helpRequests.filter(req => filterRole === 'all' || req.userRole === filterRole);

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-heading">Help Center Requests</h2>
          <p className="text-sm text-[#64748b] mt-1">
            {helpRequests.filter((e: any) => e.status === 'new').length} new &bull; {helpRequests.length} total
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <select 
            value={filterRole} 
            onChange={e => setFilterRole(e.target.value as any)}
            className="border border-[#e2e8f0] rounded-[8px] px-3 py-1.5 text-sm outline-none focus:border-primary"
          >
            <option value="all">All Roles</option>
            <option value="buyer">Buyers</option>
            <option value="supplier">Suppliers</option>
            <option value="reseller">Resellers</option>
          </select>
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-[#94a3b8]">
          <MessageSquare size={52} strokeWidth={1.5} />
          <h3 className="text-lg font-extrabold text-[#0f172a] m-0">No Help Requests</h3>
          <p className="text-sm text-[#64748b] m-0">Customer help requests will appear here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredRequests.map(req => (
            <div
              key={req._id}
              className={`bg-white border rounded-[12px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all ${req.status === 'new' ? 'border-[#fed7aa]' : 'border-[#eef2f6]'}`}
              onClick={() => handleMarkRead(req)}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="text-sm font-extrabold text-[#0f172a] m-0">{req.name}</h4>
                    <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${statusCls[req.status] || ''}`}>
                      <StatusIcon status={req.status} /> {req.status}
                    </span>
                    <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${
                      req.userRole === 'buyer'    ? 'bg-[#eff6ff] text-[#0284c7] border-[#bfdbfe]' :
                      req.userRole === 'supplier' ? 'bg-[#ecfdf5] text-[#059669] border-[#6ee7b7]' :
                                                    'bg-[#fdf4ff] text-[#9333ea] border-[#e9d5ff]'
                    }`}>
                      <User size={10} /> {req.userRole}
                    </span>
                  </div>
                  <h5 className="text-sm font-semibold text-heading mt-2 mb-1">{req.subject}</h5>
                  <p className="text-sm text-[#64748b] m-0 mb-3 leading-relaxed">{req.message}</p>
                  <div className="flex items-center gap-4 flex-wrap text-xs text-[#94a3b8]">
                    <span>{new Date(req.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="flex items-center gap-1"><Phone size={11} /> {req.phone}</span>
                    <span className="flex items-center gap-1"><Mail size={11} /> {req.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                  <a
                    href={`tel:${req.phone}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#0284c7] bg-[#eff6ff] border border-[#bfdbfe] rounded-[8px] no-underline hover:bg-[#dbeafe] transition-colors"
                  >
                    <Phone size={13} /> Call
                  </a>
                  <button
                    onClick={() => openReply(req)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-primary border-none rounded-[8px] cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <Mail size={13} /> Reply
                  </button>
                  {req.status !== 'resolved' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); markResolvedMutation.mutate(req._id); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#059669] bg-[#ecfdf5] border border-[#6ee7b7] rounded-[8px] cursor-pointer hover:bg-[#d1fae5] transition-colors"
                    >
                      <CheckCircle size={13} /> Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Email compose modal */}
      <Modal
        isOpen={!!replyTarget}
        onClose={() => setReplyTarget(null)}
        title={`Reply to ${replyTarget?.name}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setReplyTarget(null)}>
              <X size={14} className="mr-1" /> Cancel
            </Button>
            <Button onClick={handleSendReply} loading={sending} disabled={!replySubject.trim() || !replyBody.trim()}>
              <Send size={14} className="mr-1" /> Send Email
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="text-xs text-[#64748b] bg-[#f8fafc] rounded-[8px] px-3 py-2 border border-[#e2e8f0]">
            <span className="font-bold">To:</span> {replyTarget?.email}
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-[#94a3b8] tracking-wider block mb-1.5">Subject</label>
            <input
              type="text"
              value={replySubject}
              onChange={e => setReplySubject(e.target.value)}
              className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 text-sm text-[#1e293b] outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-[#94a3b8] tracking-wider block mb-1.5">Message</label>
            <textarea
              value={replyBody}
              onChange={e => setReplyBody(e.target.value)}
              rows={10}
              className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 text-sm text-[#1e293b] outline-none focus:border-primary transition-colors resize-y font-mono"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminHelpRequests;
