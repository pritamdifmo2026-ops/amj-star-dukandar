import React, { useState } from 'react';
import { Phone, Mail, MessageSquare } from 'lucide-react';
import MainLayout from '@/shared/layout/MainLayout';
import { useAppSelector } from '@/store/hooks';
import adminService from '@/features/admin/services/admin.service';

const SUBJECTS = [
  'General Enquiry',
  'Order Tracking',
  'Refund & Return',
  'Product Sourcing',
  'Account Issue',
  'Other',
];

const HelpBuyers: React.FC = () => {
  const user = useAppSelector(state => state.auth.user);

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
      await adminService.submitHelpRequest({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        subject: subject,
        message: message.trim(),
        userRole: 'buyer',
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
              Help Center
            </span>
            <h1 className="text-[clamp(2rem,5vw,3rem)] font-extrabold text-heading leading-tight mb-4">
              Help for Buyers
            </h1>
            <p className="text-body text-base max-w-lg mx-auto leading-relaxed">
              Find answers to common questions about sourcing, orders, and payments, or contact our support team.
            </p>
          </div>
        </section>

        <section className="max-w-[var(--width-container)] mx-auto px-4 sm:px-8 py-14 grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-12">
          {/* Left — contact info */}
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-extrabold text-heading mb-1">Direct Support</h2>
              <p className="text-sm text-body">Reach us through any of these channels.</p>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-[8px] bg-primary-soft flex items-center justify-center shrink-0">
                  <Phone size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-0.5">Helpline</p>
                  <p className="text-sm font-semibold text-heading">+91 9034440673</p>
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
                </div>
              </div>
            </div>

            <hr className="border-border my-2" />

            <div>
              <h2 className="text-lg font-extrabold text-heading mb-3">Frequent Questions</h2>
              <div className="flex flex-col gap-3">
                <details className="group cursor-pointer">
                  <summary className="text-sm font-bold text-heading hover:text-primary transition-colors mb-1 list-none flex justify-between">
                    How do I track my order?
                  </summary>
                  <p className="text-xs text-body leading-relaxed pl-2 border-l-2 border-primary/20">
                    You can track your order directly from your Buyer Dashboard under 'My Orders'.
                  </p>
                </details>
                <details className="group cursor-pointer">
                  <summary className="text-sm font-bold text-heading hover:text-primary transition-colors mb-1 list-none flex justify-between">
                    How do I request a product?
                  </summary>
                  <p className="text-xs text-body leading-relaxed pl-2 border-l-2 border-primary/20">
                    Use the 'Sourcing Request' feature in your dashboard to let suppliers know what you need.
                  </p>
                </details>
                <details className="group cursor-pointer">
                  <summary className="text-sm font-bold text-heading hover:text-primary transition-colors mb-1 list-none flex justify-between">
                    Is there a minimum order quantity (MOQ)?
                  </summary>
                  <p className="text-xs text-body leading-relaxed pl-2 border-l-2 border-primary/20">
                    MOQs vary by supplier. You can see the specific MOQ listed on the product page.
                  </p>
                </details>
              </div>
            </div>
          </div>

          {/* Right — form */}
          <div className="bg-white rounded-[16px] border border-border p-6 sm:p-8 shadow-sm">
            {submitted ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="text-green-500" size={24} />
                </div>
                <h3 className="text-xl font-bold text-heading mb-2">Message Sent</h3>
                <p className="text-body max-w-sm mx-auto">
                  Thank you for reaching out. Our buyer support team will get back to you shortly.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setMessage('');
                  }}
                  className="mt-6 px-6 py-2 bg-gray-100 hover:bg-gray-200 text-heading font-semibold rounded-[8px] transition-colors"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div>
                  <h3 className="text-lg font-bold text-heading mb-1">Send us a message</h3>
                  <p className="text-sm text-body">Our team is ready to assist you.</p>
                </div>
                {error && (
                  <div className="p-3 bg-red-50 text-red-600 text-sm rounded-[8px] font-medium border border-red-100">
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-heading">Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      className="w-full bg-surface border border-border rounded-[8px] px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
                      placeholder="Your name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-heading">Phone <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      className="w-full bg-surface border border-border rounded-[8px] px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
                      placeholder="Your phone number"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-heading">Email <span className="text-gray-400 font-normal">(Optional)</span></label>
                    <input
                      type="email"
                      className="w-full bg-surface border border-border rounded-[8px] px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
                      placeholder="Your email address"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-heading">Subject</label>
                    <select
                      className="w-full bg-surface border border-border rounded-[8px] px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors cursor-pointer appearance-none"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                    >
                      {SUBJECTS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-heading">Message <span className="text-red-500">*</span></label>
                  <textarea
                    className="w-full bg-surface border border-border rounded-[8px] px-4 py-3 text-sm outline-none focus:border-primary transition-colors min-h-[120px] resize-y"
                    placeholder="How can we help you?"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary text-white font-bold py-3 rounded-[8px] hover:bg-primary-dark transition-colors disabled:opacity-50 mt-2"
                >
                  {submitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default HelpBuyers;
