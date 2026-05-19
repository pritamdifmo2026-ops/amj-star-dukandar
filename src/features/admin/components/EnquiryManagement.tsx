import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Phone, Mail, MessageSquare, Clock, CheckCircle, Send, X } from 'lucide-react';
import adminService from '../services/admin.service';
import type { Enquiry } from '../types/admin.types';
import Button from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';
import toast from 'react-hot-toast';

const statusCls: Record<Enquiry['status'], string> = {
  new: 'bg-[#fff7ed] text-[#c2410c] border-[#fed7aa]',
  read: 'bg-[#f1f5f9] text-[#475569] border-[#e2e8f0]',
  replied: 'bg-[#ecfdf5] text-[#059669] border-[#6ee7b7]',
};

const StatusIcon = ({ status }: { status: Enquiry['status'] }) => {
  if (status === 'new') return <Clock size={12} />;
  if (status === 'replied') return <CheckCircle size={12} />;
  return <MessageSquare size={12} />;
};

const EnquiryManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [replyTarget, setReplyTarget] = useState<Enquiry | null>(null);
  const [replySubject, setReplySubject] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [sending, setSending] = useState(false);
  const { data: enquiries = [], isLoading } = useQuery<Enquiry[]>({
    queryKey: ['admin', 'enquiries'],
    queryFn: () => adminService.getEnquiries(),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => adminService.markEnquiryRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'enquiries'] }),
  });

  const openReply = (enquiry: Enquiry) => {
    setReplyTarget(enquiry);
    setReplySubject(`Re: Your enquiry to AMJ Star`);
    setReplyBody(`Hi ${enquiry.name},\n\nThank you for reaching out to us.\n\n\n\nWarm regards,\nTeam AMJ Star`);
    if (enquiry.status === 'new') markReadMutation.mutate(enquiry._id);
  };

  const handleSendReply = async () => {
    if (!replyTarget || !replySubject.trim() || !replyBody.trim()) return;
    setSending(true);
    try {
      await adminService.replyToEnquiry(replyTarget._id, replySubject, replyBody);
      queryClient.invalidateQueries({ queryKey: ['admin', 'enquiries'] });
      toast.success('Reply sent successfully!');
      setReplyTarget(null);
    } catch {
      toast.error('Failed to send reply. Check SMTP settings.');
    } finally {
      setSending(false);
    }
  };

  const handleMarkRead = (enquiry: Enquiry) => {
    if (enquiry.status !== 'new') return;
    markReadMutation.mutate(enquiry._id);
  };

  if (isLoading) return <div className="py-16 text-center text-sm text-[#64748b]">Loading enquiries...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-sm text-[#64748b] mt-1">
            {enquiries.filter(e => e.status === 'new').length} new &bull; {enquiries.length} total
          </p>
        </div>
      </div>

      {enquiries.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-[#94a3b8]">
          <MessageSquare size={52} strokeWidth={1.5} />
          <h3 className="text-lg font-extrabold text-[#0f172a] m-0">No Enquiries Yet</h3>
          <p className="text-sm text-[#64748b] m-0">Customer enquiries will appear here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {enquiries.map(enquiry => (
            <div
              key={enquiry._id}
              className={`bg-white border rounded-[12px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all ${enquiry.status === 'new' ? 'border-[#fed7aa]' : 'border-[#eef2f6]'}`}
              onClick={() => handleMarkRead(enquiry)}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="text-sm font-extrabold text-[#0f172a] m-0">{enquiry.name}</h4>
                    <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${statusCls[enquiry.status]}`}>
                      <StatusIcon status={enquiry.status} /> {enquiry.status}
                    </span>
                  </div>
                  <p className="text-sm text-[#64748b] m-0 mb-3 leading-relaxed">{enquiry.message}</p>
                  <div className="flex items-center gap-4 flex-wrap text-xs text-[#94a3b8]">
                    <span>{new Date(enquiry.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="flex items-center gap-1"><Phone size={11} /> {enquiry.phone}</span>
                    <span className="flex items-center gap-1"><Mail size={11} /> {enquiry.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                  <a
                    href={`tel:${enquiry.phone}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#0284c7] bg-[#eff6ff] border border-[#bfdbfe] rounded-[8px] no-underline hover:bg-[#dbeafe] transition-colors"
                  >
                    <Phone size={13} /> Call
                  </a>
                  <button
                    onClick={() => openReply(enquiry)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-primary border-none rounded-[8px] cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <Mail size={13} /> Mail
                  </button>
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

export default EnquiryManagement;
