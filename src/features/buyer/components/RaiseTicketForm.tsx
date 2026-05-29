import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import adminService from '@/features/admin/services/admin.service';
import { useAppSelector } from '@/store/hooks';
import { compressImage } from '@/shared/utils/compressImage';

// Assuming auth token is automatically attached via cookies or fetch interceptor

const priorityOptions = ['Low', 'Medium', 'High'];
const issueTypes = ['General', 'Order', 'Payment', 'Technical', 'Other'];
type Priority = (typeof priorityOptions)[number];

const getErrorMessage = (err: unknown, fallback: string) => {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
};

const RaiseTicketForm: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);
  const [subject, setSubject] = useState('');
  const [issueType, setIssueType] = useState(issueTypes[0]);
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState(priorityOptions[0]);

  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [optimizingFile, setOptimizingFile] = useState(false);

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(null);
    if (f && !allowedTypes.includes(f.type)) {
      toast.error('Unsupported file type. Allowed: jpg, jpeg, png, webp');
      e.target.value = '';
      return;
    }
    if (!f) return;

    setOptimizingFile(true);
    try {
      const optimized = await compressImage(f, 1280, 0.72);
      setFile(optimized.size < f.size ? optimized : f);
    } catch (err) {
      console.error('Image optimization failed:', err);
      setFile(f);
    } finally {
      setOptimizingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (optimizingFile) {
      toast.error('Please wait, attachment is getting ready');
      return;
    }
    if (!subject.trim() || !message.trim()) {
      toast.error('Subject and Message are required');
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }
    setSubmitting(true);
    try {
      let fileUrl: string | undefined;
      if (file) {
        try {
          // Upload the file using existing adminService (Google Cloud Storage)
          fileUrl = await adminService.uploadImage(file);
        } catch (uploadErr: unknown) {
          console.error('Upload failed:', uploadErr);
          toast.error(getErrorMessage(uploadErr, 'File upload failed'));
          setSubmitting(false);
          return;
        }
      }

      const payload = {
        buyerName: user?.name || 'Guest Buyer',
        buyerEmail: email.trim() || user?.email || undefined,
        phone: phone,
        subject: subject,
        issueType: issueType,
        message: message,
        priority: priority as Priority,
        attachmentUrl: fileUrl,
      };

      await adminService.submitTicket(payload);

      toast.success('Ticket raised successfully');
      // Reset form
      setSubject('');
      setIssueType(issueTypes[0]);
      setPhone('');
      setEmail(user?.email || '');
      setMessage('');
      setPriority(priorityOptions[0]);
      setFile(null);
    } catch (err: unknown) {
      console.error(err);
      toast.error(getErrorMessage(err, 'Error submitting ticket'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-[#eef2f6] rounded-[12px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col gap-4">
      <h3 className="text-sm font-extrabold text-[#0f172a] m-0 mb-4">Raise Ticket</h3>
      <div>
        <label className="text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider block mb-1.5">Subject *</label>
        <input
          type="text"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 text-sm text-[#1e293b] focus:border-primary transition-colors"
          placeholder="Brief subject"
          required
        />
      </div>
      <div>
        <label className="text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider block mb-1.5">Issue Type *</label>
        <select
          value={issueType}
          onChange={e => setIssueType(e.target.value)}
          className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 text-sm text-[#1e293b] focus:border-primary transition-colors"
        >
          {issueTypes.map(it => (
            <option key={it} value={it}>{it}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider block mb-1.5">Phone *</label>
        <input
          type="text"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 text-sm text-[#1e293b] focus:border-primary transition-colors"
          placeholder="10‑digit phone number"
          required
        />
      </div>
      <div>
        <label className="text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider block mb-1.5">Email <span className="font-normal normal-case text-[#94a3b8]">(for reply)</span></label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 text-sm text-[#1e293b] focus:border-primary transition-colors"
          placeholder="your@email.com"
        />
      </div>
      <div>
        <label className="text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider block mb-1.5">Message *</label>
        <textarea
          rows={4}
          value={message}
          onChange={e => setMessage(e.target.value)}
          className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 text-sm text-[#1e293b] focus:border-primary transition-colors resize-y"
          placeholder="Describe your issue in detail"
          required
        />
      </div>
      <div>
        <label className="text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider block mb-1.5">Attachment (optional)</label>
        <input type="file" accept="*" onChange={handleFileChange} className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-primary file:text-white hover:file:bg-primary/90" />
      </div>

      <button
        type="submit"
        disabled={submitting || optimizingFile}
        className="px-5 py-2.5 bg-primary text-white font-bold text-sm rounded-[8px] border-none cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
      >
        {optimizingFile ? 'Optimizing attachment...' : submitting ? 'Submitting...' : 'Submit Ticket'}
      </button>
    </form>
  );
};

export default RaiseTicketForm;
