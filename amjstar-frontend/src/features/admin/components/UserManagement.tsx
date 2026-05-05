import React, { useState } from 'react';
import { Power } from 'lucide-react';
import styles from '../pages/AdminDashboard.module.css';
import Pagination from '@/shared/components/ui/Pagination';

interface UserManagementProps {
  users: any[];
  onToggleStatus: (id: string, currentStatus: boolean) => Promise<void>;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onToggleStatus }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const pagedUsers = users.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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
          {pagedUsers.map(u => (
            <tr key={u._id}>
              <td data-label="Name">{u.name || 'N/A'}</td>
              <td data-label="Phone">{u.phone}</td>
              <td data-label="Role"><span className={styles.roleBadge}>{u.role}</span></td>
              <td data-label="Status">
                <span className={u.isActive ? styles.statusActive : styles.statusInactive}>
                  {u.isActive ? 'Active' : 'Banned'}
                </span>
              </td>
              <td data-label="Action">
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
      
      <Pagination 
        totalItems={users.length}
        itemsPerPage={ITEMS_PER_PAGE}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        styles={styles}
      />
    </div>
  );
};

export default UserManagement;
