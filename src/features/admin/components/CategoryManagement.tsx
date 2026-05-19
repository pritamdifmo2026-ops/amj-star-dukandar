import React from 'react';
import { Trash2, Plus, X, Tags, CheckCircle2, Edit2 } from 'lucide-react';
import Pagination from '@/shared/components/ui/Pagination';
import { useCategoryManagement } from '../hooks/useCategoryManagement';

const thCls = "text-left px-4 py-3.5 text-[#94a3b8] text-[0.7rem] font-extrabold uppercase tracking-[0.1em] border-b border-[#f1f5f9]";
const tdCls = "px-4 py-4 border-b border-[#f8fafc] text-sm text-[#334155]";
const inputCls = "w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 text-sm text-[#1e293b] outline-none focus:border-primary transition-colors";

const CategoryManagement: React.FC = () => {
  const {
    categories, loading, newCategory, setNewCategory,
    subcategories, setSubcategories, isSaving, loadingAction,
    modalOpen, setModalOpen, modalTitle, modalValue, setModalValue,
    handleCreateCategory, handleDeleteCategory, openModal,
    handleModalSubmit, handleDeleteSubcategory,
  } = useCategoryManagement();

  const [currentPage, setCurrentPage] = React.useState(1);
  const ITEMS_PER_PAGE = 5;
  const pagedCategories = categories.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (loading && categories.length === 0) return <div className="py-8 text-center text-sm text-[#64748b]">Loading Categories...</div>;

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleCreateCategory} className="bg-white border border-[#eef2f6] rounded-[12px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-[#fff7ed] rounded-[8px] flex items-center justify-center text-primary shrink-0"><Tags size={18} /></div>
          <h3 className="text-base font-extrabold text-[#0f172a] m-0">Create New Category</h3>
        </div>

        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase text-[#94a3b8] tracking-wider">
              Category Name <span className="text-[#dc2626]">*</span>
            </label>
            <input type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="e.g. Electronics" required className={inputCls} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase text-[#94a3b8] tracking-wider">Subcategories (Optional)</label>
            {subcategories.map((sub, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input type="text" value={sub} onChange={e => { const s = [...subcategories]; s[idx] = e.target.value; setSubcategories(s); }} placeholder="e.g. Mobile Phones" className={inputCls} />
                {subcategories.length > 1 && (
                  <button type="button" onClick={() => { const s = [...subcategories]; s.splice(idx, 1); setSubcategories(s); }} className="w-8 h-8 rounded-full bg-[#fef2f2] text-[#dc2626] flex items-center justify-center border-none cursor-pointer hover:bg-[#fee2e2] shrink-0">
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setSubcategories([...subcategories, ''])} className="flex items-center gap-1.5 text-xs text-primary font-bold bg-transparent border-none cursor-pointer p-0 mt-1">
              <Plus size={14} /> Add Subcategory
            </button>
          </div>
        </div>

        <div className="flex justify-end mt-5">
          <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold text-sm rounded-[8px] border-none cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity">
            {isSaving ? 'Saving...' : <><CheckCircle2 size={16} /> Save Category</>}
          </button>
        </div>
      </form>

      <div className="bg-white rounded-[10px] border border-[#eef2f6] shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={thCls}>Category</th>
                <th className={thCls}>Subcategories</th>
                <th className={thCls + " text-right"}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedCategories.map(c => (
                <tr key={c._id} className="hover:bg-[#fafbfc]">
                  <td className={tdCls + " font-semibold"}>{c.name}</td>
                  <td className={tdCls}>
                    <div className="flex flex-wrap gap-2 items-center">
                      {(c.subcategories || []).map((sub: any) => (
                        <span key={sub._id} className="inline-flex items-center gap-1.5 bg-[#f3f4f6] border border-[#e5e7eb] text-xs px-2.5 py-1 rounded-full">
                          {sub.name}
                          <span className="flex gap-1 ml-1">
                            <button type="button" onClick={() => openModal('edit-sub', sub._id, sub.name, 'Edit Subcategory')} className="bg-transparent border-none p-0 cursor-pointer text-[#64748b] flex items-center hover:text-primary"><Edit2 size={11} /></button>
                            <button type="button" onClick={() => handleDeleteSubcategory(sub._id)} disabled={loadingAction === `del-sub-${sub._id}`} className="bg-transparent border-none p-0 cursor-pointer text-[#ef4444] flex items-center hover:text-[#dc2626]"><X size={11} /></button>
                          </span>
                        </span>
                      ))}
                      <button type="button" onClick={() => openModal('add-sub', c._id, '', 'Add New Subcategory')} className="inline-flex items-center gap-1 bg-white border border-dashed border-[#d1d5db] text-xs text-[#6b7280] px-2.5 py-1 rounded-full cursor-pointer hover:border-primary hover:text-primary transition-colors">
                        <Plus size={11} /> Add
                      </button>
                    </div>
                  </td>
                  <td className={tdCls}>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openModal('edit-cat', c._id, c.name, 'Edit Category')} disabled={loadingAction === `edit-cat-${c._id}`} className="w-8 h-8 rounded-[6px] border border-[#e2e8f0] flex items-center justify-center text-[#475569] cursor-pointer hover:bg-[#f8fafc] bg-white">
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => handleDeleteCategory(c._id)} disabled={loadingAction === `del-cat-${c._id}`} className="w-8 h-8 rounded-[6px] border border-[#fecaca] flex items-center justify-center text-[#dc2626] cursor-pointer hover:bg-[#fef2f2] bg-white">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-sm text-[#64748b]">No categories found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination totalItems={categories.length} itemsPerPage={ITEMS_PER_PAGE} currentPage={currentPage} onPageChange={setCurrentPage} />
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] z-50 flex items-center justify-center px-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-[12px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-6 w-full max-w-[400px]" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-extrabold text-[#0f172a] m-0 mb-4">{modalTitle}</h3>
            <input
              type="text"
              autoFocus
              value={modalValue}
              onChange={e => setModalValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleModalSubmit()}
              placeholder="Enter name..."
              className={inputCls + " mb-4"}
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setModalOpen(false)} disabled={loadingAction !== null} className="px-4 py-2 text-sm font-semibold text-[#475569] bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] cursor-pointer hover:bg-[#f1f5f9] disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleModalSubmit} disabled={loadingAction !== null || !modalValue.trim()} className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-[8px] border-none cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
                {loadingAction === 'modal-action' ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;
