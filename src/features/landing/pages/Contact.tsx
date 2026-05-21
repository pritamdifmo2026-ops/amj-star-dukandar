import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Phone, Mail, MapPin, LogIn, CheckCircle } from 'lucide-react';
import MainLayout from '@/shared/layout/MainLayout';
import { useAppSelector } from '@/store/hooks';
import adminService from '@/features/admin/services/admin.service';
import { ROUTES } from '@/shared/constants/routes';

const SUBJECTS = [
  'General Enquiry',
  'Technical Issue',
  'Billing & Payments',
  'Product Related',
  'Account Issue',
  'Other',
];

const ROLE_LABEL: Record<string, string> = {
  buyer: 'Buyer',
  supplier: 'Supplier',
  reseller: 'Reseller',
};

const Contact: React.FC = () => {
  const user = useAppSelector(state => state.auth.user);
  const isLoggedIn = !!user && user.role !== 'admin';

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) {
      setError('Name, phone and message are required.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await adminService.submitEnquiry({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        message: `[${subject}] ${message.trim()}`,
        userRole: user?.role as any,
      });
      setSubmitted(true);
    } catch {
      setError('Failed to send. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="bg-surface min-h-screen">
        {/* Header */}
        <section className="bg-gradient-to-br from-white to-[oklch(0.97_0.02_75)] pt-24 pb-14 border-b border-border">
          <div className="max-w-[var(--width-container)] mx-auto px-4 sm:px-8 text-center">
            <span className="inline-block px-4 py-1.5 bg-primary-soft text-primary rounded-full text-sm font-bold mb-4">
              Get in Touch
            </span>
            <h1 className="text-[clamp(2rem,5vw,3rem)] font-extrabold text-heading leading-tight mb-4">
              We're here to help
            </h1>
            <p className="text-body text-base max-w-lg mx-auto leading-relaxed">
              Have a question, issue or feedback? Send us a message and our team will get back to you.
            </p>
          </div>
        </section>

        <section className="max-w-[var(--width-container)] mx-auto px-4 sm:px-8 py-14 grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-12">
          {/* Left — contact info */}
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-extrabold text-heading mb-1">Contact Details</h2>
              <p className="text-sm text-body">Reach us through any of these channels.</p>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-[8px] bg-primary-soft flex items-center justify-center shrink-0">
                  <Phone size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-0.5">Phone</p>
                  <p className="text-sm font-semibold text-heading">1800-XXX-XXXX</p>
                  <p className="text-xs text-body">Mon–Sat, 9am–6pm</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-[8px] bg-primary-soft flex items-center justify-center shrink-0">
                  <Mail size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-0.5">Email</p>
                  <p className="text-sm font-semibold text-heading">support@amjstar.com</p>
                  <p className="text-xs text-body">We reply within 24 hours</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-[8px] bg-primary-soft flex items-center justify-center shrink-0">
                  <MapPin size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-0.5">Office</p>
                  <p className="text-sm font-semibold text-heading">AMJStar HQ</p>
                  <p className="text-xs text-body">India</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right — form or auth gate */}
          <div className="bg-white border border-border rounded-[14px] p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            {submitted ? (
              /* Success state */
              <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#ecfdf5] flex items-center justify-center">
                  <CheckCircle size={32} className="text-[#059669]" />
                </div>
                <h3 className="text-xl font-extrabold text-heading">Message Sent!</h3>
                <p className="text-sm text-body max-w-sm">
                  Thanks for reaching out. Our team will review your message and get back to you shortly.
                </p>
                <button
                  onClick={() => { setSubmitted(false); setMessage(''); setSubject(SUBJECTS[0]); }}
                  className="mt-2 px-5 py-2 bg-primary text-white rounded-full text-sm font-semibold cursor-pointer border-none hover:bg-primary-dark transition-colors"
                >
                  Send Another
                </button>
              </div>
            ) : !isLoggedIn ? (
              /* Auth gate */
              <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#eff6ff] flex items-center justify-center">
                  <LogIn size={28} className="text-[#0284c7]" />
                </div>
                <h3 className="text-xl font-extrabold text-heading">Sign in to Contact Us</h3>
                <p className="text-sm text-body max-w-sm">
                  You need to be logged in as a Buyer, Supplier, or Reseller to send us a message.
                </p>
                <Link
                  to={`${ROUTES.LOGIN}?redirect=/contact`}
                  className="mt-2 px-6 py-2.5 bg-primary text-white rounded-full text-sm font-semibold no-underline hover:bg-primary-dark transition-colors"
                >
                  Sign In
                </Link>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare size={16} className="text-primary" />
                  <h3 className="text-base font-extrabold text-heading m-0">Send us a message</h3>
                  {user?.role && ROLE_LABEL[user.role] && (
                    <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#eff6ff] text-[#0284c7] border border-[#bfdbfe] uppercase tracking-wide">
                      {ROLE_LABEL[user.role]}
                    </span>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-[8px]">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wide mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full px-3 py-2.5 rounded-[8px] border border-[#e2e8f0] focus:border-primary text-sm outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wide mb-1.5">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="10-digit number"
                      className="w-full px-3 py-2.5 rounded-[8px] border border-[#e2e8f0] focus:border-primary text-sm outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wide mb-1.5">
                    Email <span className="text-[#94a3b8] normal-case font-normal tracking-normal">(optional)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2.5 rounded-[8px] border border-[#e2e8f0] focus:border-primary text-sm outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wide mb-1.5">
                    Subject
                  </label>
                  <select
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-[8px] border border-[#e2e8f0] focus:border-primary text-sm outline-none transition-colors bg-white"
                  >
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wide mb-1.5">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Describe your issue or question in detail..."
                    rows={5}
                    className="w-full px-3 py-2.5 rounded-[8px] border border-[#e2e8f0] focus:border-primary text-sm outline-none transition-colors resize-y"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-primary text-white font-semibold text-sm rounded-[8px] border-none cursor-pointer hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default Contact;
