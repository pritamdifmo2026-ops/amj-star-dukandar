import React from 'react';
import { Power } from 'lucide-react';
import styles from '../pages/AdminDashboard.module.css';

interface UserManagementProps {
  users: any[];
  onToggleStatus: (id: string, currentStatus: boolean) => Promise<void>;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onToggleStatus }) => {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Role</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u._id}>
              <td>{u.name || 'N/A'}</td>
              <td>{u.phone}</td>
              <td><span className={styles.roleBadge}>{u.role}</span></td>
              <td>
                <span className={u.isActive ? styles.statusActive : styles.statusInactive}>
                  {u.isActive ? 'Active' : 'Banned'}
                </span>
              </td>
              <td>
                <button
                  onClick={() => onToggleStatus(u._id, u.isActive)}
                  className={u.isActive ? styles.banBtn : styles.unbanBtn}
                >
                  <Power size={18} /> {u.isActive ? 'Ban' : 'Activate'}
                </button>
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr><td colSpan={5} className={styles.empty}>No users found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UserManagement;
