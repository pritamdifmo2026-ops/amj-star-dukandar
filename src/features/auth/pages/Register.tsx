import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Lock, Phone } from 'lucide-react';
import Input from '@/shared/components/ui/Input';
import Button from '@/shared/components/ui/Button';
import { ROUTES } from '@/shared/constants/routes';
import { useRegister } from '../hooks/useRegister';
import styles from './Register.module.css';

const Register: React.FC = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'reseller' as 'reseller' | 'supplier',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { mutate: register, isPending } = useRegister();

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'Full name is required';
    if (!/^[a-z0-9]+@[a-z0-9]+\.[a-z]{2,}$/.test(form.email)) newErrors.email = 'Please enter a valid email address';
    if (!/^\d{10}$/.test(form.phone)) newErrors.phone = 'Valid 10-digit phone number is required';
    if (form.password.length < 8) newErrors.password = 'Password must be at least 8 characters';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let val = e.target.value;
    if (field === 'email') {
      val = val.toLowerCase().replace(/[^a-z0-9@.]/g, '');
      val = val.replace(/[@.]{2,}/g, (match) => match[0]);
      if (val.startsWith('.') || val.startsWith('@')) val = val.slice(1);
    }
    setForm((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      register(form);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2 className={styles.heading}>Create Account</h2>
      <p className={styles.sub}>Join AMJStar as a buyer or supplier</p>

      <div className={styles.fields}>
        <Input label="Full Name" type="text" placeholder="Your full name" value={form.name} onChange={set('name')} leftIcon={<User size={16} />} fullWidth required error={errors.name} />
        <Input label="Email Address" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} leftIcon={<Mail size={16} />} fullWidth required error={errors.email} />
        <Input label="Phone Number" type="tel" placeholder="10-digit mobile number" value={form.phone} onChange={set('phone')} leftIcon={<Phone size={16} />} fullWidth required error={errors.phone} maxLength={10} />
        <Input label="Password" type="password" placeholder="Min. 8 characters" value={form.password} onChange={set('password')} leftIcon={<Lock size={16} />} fullWidth required error={errors.password} />

        <div className={styles.roleGroup}>
          <label className={styles.roleLabel}>I am a</label>
          <div className={styles.roleOptions}>
            {(['reseller', 'supplier'] as const).map((r) => (
              <label key={r} className={[styles.roleOption, form.role === r ? styles.active : ''].join(' ')}>
                <input type="radio" name="role" value={r} checked={form.role === r} onChange={set('role')} hidden />
                {r === 'reseller' ? 'Reseller / Buyer' : 'Supplier / Manufacturer'}
              </label>
            ))}
          </div>
        </div>
      </div>

      <Button type="submit" fullWidth loading={isPending}>
        Create Account
      </Button>

      <p className={styles.switch}>
        Already have an account?{' '}
        <Link to={ROUTES.LOGIN} className={styles.link}>
          Sign In
        </Link>
      </p>
    </form>
  );
};

export default Register;
