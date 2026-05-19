import React, { useState } from 'react';
import { Power } from 'lucide-react';
import Pagination from '@/shared/components/ui/Pagination';

import type { AdminUser } from '../types/admin.types';

interface UserManagementProps {
  users: AdminUser[];
  onToggleStatus: (id: string, currentStatus: boolean) => void;
}

const thCls = "text-left px-4 py-3.5 text-[#94a3b8] text-[0.7rem] font-extrabold uppercase tracking-[0.1em] border-b border-[#f1f5f9] max-md:hidden";
const tdCls = "px-4 py-4 border-b border-[#f8fafc] text-sm text-[#334155] max-md:flex max-md:justify-between max-md:items-center max-md:border-none max-md:py-2 max-md:px-0 text-right md:text-left";
const trCls = "hover:bg-[#fafbfc] max-md:block max-md:p-4 max-md:border-b max-md:border-[#e2e8f0] last:border-none";

const UserManagement: React.FC<UserManagementProps> = ({ users, onToggleStatus }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;
  const pagedUsers = users.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="bg-white rounded-[10px] border border-[#eef2f6] shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
      <div className="w-full">
        <table className="w-full border-collapse max-md:block">
          <thead className="max-md:hidden">
            <tr>
              {['Name', 'Phone', 'Role', 'Status', 'Action'].map(h => <th key={h} className={thCls}>{h}</th>)}
            </tr>
          </thead>
          <tbody className="max-md:block">
            {pagedUsers.map(u => (
              <tr key={u._id} className={trCls}>
                <td className={tdCls}><span className="md:hidden font-bold text-xs text-[#94a3b8] uppercase">Name</span> {u.name || 'N/A'}</td>
                <td className={tdCls}><span className="md:hidden font-bold text-xs text-[#94a3b8] uppercase">Phone</span> {u.phone}</td>
                <td className={tdCls}>
                  <span className="md:hidden font-bold text-xs text-[#94a3b8] uppercase">Role</span>
                  <span className="text-xs bg-[#f0f9ff] text-[#0369a1] border border-[#bae6fd] px-2 py-0.5 rounded-full font-semibold">{u.role}</span>
                </td>
                <td className={tdCls}>
                  <span className="md:hidden font-bold text-xs text-[#94a3b8] uppercase">Status</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${u.isActive ? 'bg-[#ecfdf5] text-[#059669]' : 'bg-[#fef2f2] text-[#dc2626]'}`}>
                    {u.isActive ? 'Active' : 'Banned'}
                  </span>
                </td>
                <td className={tdCls}>
                  <span className="md:hidden font-bold text-xs text-[#94a3b8] uppercase">Action</span>
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
              <tr className="max-md:block max-md:p-4"><td colSpan={5} className="px-4 py-8 text-center text-sm text-[#64748b] max-md:block max-md:p-0">No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination totalItems={users.length} itemsPerPage={ITEMS_PER_PAGE} currentPage={currentPage} onPageChange={setCurrentPage} />
    </div>
  );
};

export default UserManagement;
