import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import adminService from '@/features/admin/services/admin.service';
import { useAppSelector } from '@/store/hooks';
import { Loader2 } from 'lucide-react';


interface Reply {
  sender: 'admin' | 'buyer';
  message: string;
  createdAt: string;
}

interface Ticket {
  id: string;
  ticketId: string;
  buyerName: string;
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

const TicketList: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user) as any;
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [reply, setReply] = useState('');
  const [replying, setReplying] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const all = await adminService.getTickets();
      // Filter tickets belonging to current buyer (by name or phone)
      const userTickets = all.filter((t: Ticket) =>
        t.buyerName === user?.name || t.phone === user?.phone
      );
      setTickets(userTickets);
      return userTickets;
    } catch (err) {
      console.error(err);
      toast.error('Failed to load tickets');
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchTickets();
  }, [user]);

  const handleReply = async (ticketId: string) => {
    if (!reply.trim()) return;
    setReplying(true);
    try {
      await adminService.replyToTicket(ticketId, reply.trim());
      toast.success('Reply sent');
      setReply('');
      // refresh tickets
      const updatedTickets = await fetchTickets();
      // re-select updated ticket
      const updated = updatedTickets.find(t => t.id === ticketId);
      if (updated) setSelected(updated);
    } catch (err) {
      console.error(err);
      toast.error('Failed to send reply');
    } finally {
      setReplying(false);
    }
  };

  return (
    <div className="p-6 max-w-[1000px] mx-auto">
      <h3 className="text-sm font-extrabold text-[#0f172a] mb-4">My Tickets</h3>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-[#64748b]">
          <Loader2 size={16} className="animate-spin text-primary" /> Loading tickets...
        </div>
      ) : tickets.length === 0 ? (
        <p className="text-sm text-[#64748b]">No tickets found.</p>
      ) : (
        <table className="w-full table-auto border border-[#e2e8f0] rounded-md overflow-hidden">
          <thead className="bg-[#f9fafb]">
            <tr>
              <th className="p-2 text-xs text-[#64748b]">Ticket ID</th>
              <th className="p-2 text-xs text-[#64748b]">Subject</th>
              <th className="p-2 text-xs text-[#64748b]">Issue Type</th>
              <th className="p-2 text-xs text-[#64748b]">Priority</th>
              <th className="p-2 text-xs text-[#64748b]">Status</th>
              <th className="p-2 text-xs text-[#64748b]">Created</th>
              <th className="p-2 text-xs text-[#64748b]">Action</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id} className="border-t border-[#e2e8f0]">
                <td className="p-2 text-sm text-[#0f172a]">{t.ticketId}</td>
                <td className="p-2 text-sm text-[#0f172a]">{t.subject}</td>
                <td className="p-2 text-sm text-[#0f172a]">{t.issueType}</td>
                <td className="p-2 text-sm text-[#0f172a]">{t.priority}</td>
                <td className="p-2 text-sm text-[#0f172a]">{t.status}</td>
                <td className="p-2 text-sm text-[#0f172a]">
                  {new Date(t.createdAt).toLocaleDateString()}
                </td>
                <td className="p-2 text-center">
                  <button
                    className="px-3 py-1 bg-primary text-white text-xs rounded-[6px] hover:opacity-90"
                    onClick={() => setSelected(t)}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Ticket details and conversation */}
      {selected && (
        <div className="mt-6 border-t border-[#f1f5f9] pt-4">
          <h4 className="text-sm font-bold text-[#0f172a] mb-2">Ticket #{selected.ticketId}</h4>
          <p className="text-sm mb-2"><strong>Subject:</strong> {selected.subject}</p>
          <p className="text-sm mb-2"><strong>Message:</strong> {selected.message}</p>
          {/* Conversation History */}
          <div className="mt-4 border-t border-[#f1f5f9] pt-4">
            <h5 className="font-bold text-[10px] uppercase tracking-wider text-[#64748b] mb-3">
              Conversation History
            </h5>
            {selected.replies && selected.replies.length > 0 ? (
              <div className="space-y-3 max-h-48 overflow-y-auto mb-3 pr-1">
                {selected.replies.map((r, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-[8px] text-xs border ${
                      r.sender === 'admin'
                        ? 'bg-slate-50/50 border-slate-100/80 text-right ml-10'
                        : 'bg-[#f4f3ff]/40 border-[#e2dfff]/40 text-left mr-10'
                    }`}
                  >
                    <div className="font-extrabold text-[#64748b] mb-1 text-[9px] uppercase tracking-wide">
                      {r.sender === 'admin' ? 'Admin Reply' : 'Buyer'}
                    </div>
                    <div className="text-[#334155] leading-relaxed whitespace-pre-wrap">
                      {r.message}
                    </div>
                    <div className="text-[9px] text-[#94a3b8] mt-1.5 font-medium">
                      {new Date(r.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#64748b] italic">No replies yet.</p>
            )}
            {/* Reply box for buyer */}
            <div className="flex gap-2 mt-2">
              <textarea
                className="flex-1 border border-[#e2e8f0] rounded-[8px] p-2.5 text-xs focus:border-primary outline-none resize-none"
                rows={2}
                placeholder="Write a reply..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
              <button
                className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-[8px] border-none cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => handleReply(selected.id)}
                disabled={replying}
              >
                {replying ? 'Sending…' : 'Send Reply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketList;
