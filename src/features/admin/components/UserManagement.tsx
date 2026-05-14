import React, { useState } from 'react';
import { Power } from 'lucide-react';
import Pagination from '@/shared/components/ui/Pagination';

import type { AdminUser } from '../types/admin.types';

interface UserManagementProps {
  users: AdminUser[];
  onToggleStatus: (id: string, currentStatus: boolean) => void;
}

const thCls = "text-left px-4 py-3.5 text-[#94a3b8] text-[0.7rem] font-extrabold uppercase tracking-[0.1em] border-b border-[#f1f5f9]";
const tdCls = "px-4 py-4 border-b border-[#f8fafc] text-sm text-[#334155]";

const UserManagement: React.FC<UserManagementProps> = ({ users, onToggleStatus }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;
  const pagedUsers = users.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="bg-white rounded-[10px] border border-[#eef2f6] shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['Name', 'Phone', 'Role', 'Status', 'Action'].map(h => <th key={h} className={thCls}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {pagedUsers.map(u => (
              <tr key={u._id} className="hover:bg-[#fafbfc]">
                <td className={tdCls}>{u.name || 'N/A'}</td>
                <td className={tdCls}>{u.phone}</td>
                <td className={tdCls}>
                  <span className="text-xs bg-[#f0f9ff] text-[#0369a1] border border-[#bae6fd] px-2 py-0.5 rounded-full font-semibold">{u.role}</span>
                </td>
                <td className={tdCls}>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${u.isActive ? 'bg-[#ecfdf5] text-[#059669]' : 'bg-[#fef2f2] text-[#dc2626]'}`}>
                    {u.isActive ? 'Active' : 'Banned'}
                  </span>
                </td>
                <td className={tdCls}>
                  <button
                    onClick={() => onToggleStatus(u._id, u.isActive)}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-[6px] border-none cursor-pointer transition-colors ${u.isActive ? 'bg-[#fef2f2] text-[#dc2626] hover:bg-[#fee2e2]' : 'bg-[#ecfdf5] text-[#059669] hover:bg-[#d1fae5]'}`}
                  >
                    <Power size={14} /> {u.isActive ? 'Ban' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-[#64748b]">No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination totalItems={users.length} itemsPerPage={ITEMS_PER_PAGE} currentPage={currentPage} onPageChange={setCurrentPage} />
    </div>
  );
};

export default UserManagement;
