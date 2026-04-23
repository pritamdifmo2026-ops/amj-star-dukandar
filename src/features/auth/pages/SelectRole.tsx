import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Store, ShoppingBag } from 'lucide-react';
import authService from '../services/auth.service';
import { setToken } from '@/shared/utils/auth';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/slices/auth.slice';
import type { UserRole } from '../types';
import styles from '../components/Auth.module.css';

const SelectRole: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [token, setTokenState] = useState('');
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const tempToken = localStorage.getItem('temp_token');
    if (!tempToken) {
      navigate('/login');
    } else {
      setTokenState(tempToken);
    }
  }, [navigate]);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleSubmit = async () => {
    if (!selectedRole) {
      setError('Please select a role to continue');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await authService.selectRole({ role: selectedRole, token });
      setToken(response.token);
      localStorage.removeItem('temp_token');
      localStorage.removeItem('temp_phone');

      // Update Redux state
      dispatch(setCredentials({
        token: response.token,
        user: { id: 'temp-id', name: 'User', email: '', role: selectedRole }
      }));

      if (selectedRole === 'supplier') navigate('/supplier');
      else if (selectedRole === 'reseller') navigate('/reseller');
      else navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to set role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const roles: { id: UserRole; name: string; icon: any; desc: string }[] = [
    { id: 'buyer', name: 'Buyer', icon: ShoppingBag, desc: 'Browse and buy products' },
    { id: 'supplier', name: 'Supplier', icon: Store, desc: 'Sell products in bulk' },
    { id: 'reseller', name: 'Reseller', icon: User, desc: 'Resell products to your network' },
  ];

  return (
    <>
      <h1 className={styles.title}>Choose Your Role</h1>
      <p className={styles.subtitle}>Tell us how you plan to use AMJ</p>

      <div className={styles.roleGrid}>
        {roles.map((role) => {
          const Icon = role.icon;
          return (
            <div
              key={role.id}
              className={`${styles.roleOption} ${selectedRole === role.id ? styles.selected : ''}`}
              onClick={() => handleRoleSelect(role.id)}
            >
              <Icon size={32} color={selectedRole === role.id ? '#007bff' : '#666'} />
              <span className={styles.roleName}>{role.name}</span>
              <p style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>{role.desc}</p>
            </div>
          );
        })}
      </div>

      {error && <p className={styles.error} style={{ marginTop: '16px' }}>{error}</p>}

      <button
        className={styles.button}
        style={{ marginTop: '24px', width: '100%' }}
        disabled={!selectedRole || loading}
        onClick={handleSubmit}
      >
        {loading ? 'Setting up...' : 'Continue'}
      </button>
    </>
  );
};

export default SelectRole;
