import React, { useState } from 'react';
import { User } from 'lucide-react';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import authService from '@/features/auth/services/auth.service';
import { setCredentials } from '@/features/auth/store/auth.slice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const ProfileCompletionModal: React.FC<Props> = ({ isOpen, onClose, onComplete }) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    let valid = true;

    if (!trimmedName) {
      setNameError('Name is required to send an enquiry.');
      valid = false;
    } else setNameError('');

    if (!trimmedEmail) {
      setEmailError('Email is required to send an enquiry.');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError('Enter a valid email address.');
      valid = false;
    } else setEmailError('');

    if (!valid) return;

    setSaving(true);
    try {
      const response = await authService.updateProfile({
        name: trimmedName,
        email: trimmedEmail,
      });
      dispatch(setCredentials({ user: response.user }));
      onComplete();
    } catch (err: any) {
      setNameError(err?.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Complete your profile"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save & Continue'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-3 bg-[#eff6ff] border border-[#bfdbfe] rounded-[8px] px-4 py-3">
          <User size={16} className="text-[#2563eb] mt-0.5 shrink-0" />
          <p className="text-sm text-[#1e40af] leading-snug">
            Your name is required so the supplier knows who they're talking to.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wide mb-1.5">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setNameError(''); }}
            placeholder="e.g. Rahul Sharma"
            className={`w-full px-3 py-2.5 rounded-[8px] border text-sm outline-none transition-colors ${
              nameError
                ? 'border-red-400 focus:border-red-500'
                : 'border-[#e2e8f0] focus:border-[#0284c7]'
            }`}
            autoFocus
          />
          {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wide mb-1.5">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setEmailError(''); }}
            placeholder="e.g. rahul@business.com"
            className={`w-full px-3 py-2.5 rounded-[8px] border text-sm outline-none transition-colors ${
              emailError ? 'border-red-400 focus:border-red-500' : 'border-[#e2e8f0] focus:border-[#0284c7]'
            }`}
          />
          {emailError
            ? <p className="text-xs text-red-500 mt-1">{emailError}</p>
            : <p className="text-xs text-[#94a3b8] mt-1">Suppliers use this to reach you and send order updates.</p>}
        </div>
      </div>
    </Modal>
  );
};

export default ProfileCompletionModal;
