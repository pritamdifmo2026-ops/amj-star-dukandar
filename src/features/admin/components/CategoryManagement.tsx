import React, { useEffect, useState } from 'react';
import { Trash2, Plus, X, Tags, CheckCircle2, Edit2, ShieldCheck, AlertCircle } from 'lucide-react';
import Pagination from '@/shared/components/ui/Pagination';
import { useCategoryManagement } from '../hooks/useCategoryManagement';
import categoryService from '@/features/product/services/category.service';
import type { CertificationType } from '../types/admin.types';

const thCls = "text-left px-4 py-3.5 text-[#94a3b8] text-[0.7rem] font-extrabold uppercase tracking-[0.1em] border-b border-[#f1f5f9] max-md:hidden";
const tdCls = "px-4 py-4 border-b border-[#f8fafc] text-sm text-[#334155] max-md:flex max-md:justify-between max-md:items-center max-md:border-none max-md:py-2 max-md:px-0 text-right md:text-left";
const trCls = "hover:bg-[#fafbfc] max-md:block max-md:p-4 max-md:border-b max-md:border-[#e2e8f0] last:border-none";
const inputCls = "w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 text-sm text-[#1e293b] outline-none focus:border-primary transition-colors";

const CERT_SUGGESTIONS = [
  'FSSAI', 'BIS', 'ISO 9001', 'ISO 14001', 'ISO 22000', 'CE Mark',
  'Drug License', 'MSME Registered', 'GMP Certified', 'HACCP',
  'AGMARK', 'Export License', 'Trade License', 'Factory License',
  'Organic Certification', 'Halal', 'Kosher', 'REACH Compliance',
];

// ─── Certification Types Manager ─────────────────────────────────────────────
const CertTypesPanel: React.FC<{
  certTypes: CertificationType[];
  onRefresh: () => void;
}> = ({ certTypes, onRefresh }) => {
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [showSugg, setShowSugg] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await categoryService.createCertType(newName.trim(), newDesc.trim());
      if (res.success) { setNewName(''); setNewDesc(''); onRefresh(); }
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const handleRemove = async (id: string) => {
    setRemoving(id);
    try {
      await categoryService.deleteCertType(id);
      onRefresh();
    } catch { /* ignore */ }
    finally { setRemoving(null); }
  };

  return (
    <div className="bg-white border border-[#eef2f6] rounded-[12px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 bg-[#eff6ff] rounded-[8px] flex items-center justify-center text-[#2563eb] shrink-0"><ShieldCheck size={18} /></div>
        <div>
          <h3 className="text-base font-extrabold text-[#0f172a] m-0">Certification Types</h3>
          <p className="text-xs text-[#64748b] m-0">Manage the master list of certification / document types used across categories.</p>
        </div>
      </div>

      {/* Existing types */}
      <div className="flex flex-wrap gap-2 mb-4">
        {certTypes.length === 0 && <p className="text-xs text-[#94a3b8]">No certification types yet.</p>}
        {certTypes.map(ct => (
          <span key={ct._id} className="inline-flex items-center gap-1.5 bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe] px-2.5 py-1 rounded-full text-xs font-semibold">
            {ct.name}
            <button
              type="button"
              onClick={() => handleRemove(ct._id)}
              disabled={removing === ct._id}
              className="bg-transparent border-none p-0 cursor-pointer text-[#1d4ed8] hover:text-[#dc2626] leading-none"
            >
              <X size={11} />
            </button>
          </span>
        ))}
      </div>

      {/* Add new */}
      <form onSubmit={handleCreate} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
          <div className="relative">
            <input
              className={inputCls}
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onFocus={() => setShowSugg(true)}
              onBlur={() => setTimeout(() => setShowSugg(false), 150)}
              placeholder="Certification name (e.g. FSSAI)"
            />
            {showSugg && (
              <div className="absolute top-full left-0 right-0 z-20 bg-white border border-[#e2e8f0] rounded-[8px] shadow-lg mt-1 max-h-48 overflow-y-auto">
                {CERT_SUGGESTIONS.filter(s => !certTypes.find(c => c.name === s) && s.toLowerCase().includes(newName.toLowerCase())).map(s => (
                  <button key={s} type="button" onMouseDown={() => setNewName(s)}
                    className="w-full text-left px-3 py-2 text-sm text-[#334155] hover:bg-[#f1f5f9] border-none bg-transparent cursor-pointer">{s}</button>
                ))}
              </div>
            )}
          </div>
          <input
            className={inputCls}
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            placeholder="Short description (optional)"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving || !newName.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white text-sm font-bold rounded-[8px] border-none cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Adding...' : <><Plus size={14} /> Add Certification Type</>}
          </button>
        </div>
      </form>
    </div>
  );
};

// ─── Per-Category Certification Config Modal ──────────────────────────────────
const CertConfigModal: React.FC<{
  category: any;
  certTypes: CertificationType[];
  onClose: () => void;
  onSaved: () => void;
}> = ({ category, certTypes, onClose, onSaved }) => {
  const [rows, setRows] = useState<{ name: string; certificationTypeId: string; mandatory: boolean; description: string }[]>(
    (category.requiredCertifications || []).map((c: any) => ({
      name: c.name,
      certificationTypeId: c.certificationTypeId || '',
      mandatory: c.mandatory ?? true,
      description: c.description || '',
    }))
  );
  const [saving, setSaving] = useState(false);
  const [customName, setCustomName] = useState('');
  const [showSugg, setShowSugg] = useState(false);

  const addCert = (name: string, typeId = '') => {
    if (!name.trim()) return;
    if (rows.find(r => r.name.toLowerCase() === name.toLowerCase())) return;
    setRows(prev => [...prev, { name: name.trim(), certificationTypeId: typeId, mandatory: true, description: '' }]);
    setCustomName('');
  };

  const removeRow = (idx: number) => setRows(prev => prev.filter((_, i) => i !== idx));
  const toggleMandatory = (idx: number) => setRows(prev => prev.map((r, i) => i === idx ? { ...r, mandatory: !r.mandatory } : r));

  const handleSave = async () => {
    setSaving(true);
    try {
      await categoryService.setCertifications(category._id, rows);
      onSaved();
      onClose();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const allCertNames = [...certTypes.map(c => c.name), ...CERT_SUGGESTIONS].filter((v, i, a) => a.indexOf(v) === i);
  const available = allCertNames.filter(n => !rows.find(r => r.name.toLowerCase() === n.toLowerCase()));

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="bg-white rounded-[14px] shadow-2xl w-full max-w-[520px] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f1f5f9]">
          <div>
            <h3 className="text-base font-extrabold text-[#0f172a] m-0">Certification Requirements</h3>
            <p className="text-xs text-[#64748b] m-0 mt-0.5">Category: <strong>{category.name}</strong></p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f1f5f9] bg-transparent border-none cursor-pointer text-[#64748b]"><X size={16} /></button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
          {/* Added certifications */}
          {rows.length === 0 ? (
            <div className="flex items-center gap-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-[10px] px-4 py-3 text-xs text-[#64748b]">
              <AlertCircle size={14} className="text-[#94a3b8]" />
              No certifications required for this category. Products will go live without compliance review.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {rows.map((row, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-[10px] px-4 py-3">
                  <ShieldCheck size={14} className="text-[#2563eb] shrink-0" />
                  <span className="flex-1 text-sm font-semibold text-[#0f172a]">{row.name}</span>
                  <button
                    type="button"
                    onClick={() => toggleMandatory(idx)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border-none cursor-pointer ${row.mandatory ? 'bg-[#fef2f2] text-[#dc2626]' : 'bg-[#f0fdf4] text-[#15803d]'}`}
                  >
                    {row.mandatory ? 'Mandatory' : 'Optional'}
                  </button>
                  <button type="button" onClick={() => removeRow(idx)} className="bg-transparent border-none cursor-pointer text-[#94a3b8] hover:text-[#dc2626] p-0 leading-none"><X size={14} /></button>
                </div>
              ))}
            </div>
          )}

          {/* Add from existing types */}
          {certTypes.filter(ct => !rows.find(r => r.name.toLowerCase() === ct.name.toLowerCase())).length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase text-[#94a3b8] tracking-wider mb-2">Add from existing types</p>
              <div className="flex flex-wrap gap-1.5">
                {certTypes
                  .filter(ct => !rows.find(r => r.name.toLowerCase() === ct.name.toLowerCase()))
                  .map(ct => (
                    <button key={ct._id} type="button" onClick={() => addCert(ct.name, ct._id)}
                      className="flex items-center gap-1 bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe] px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer hover:bg-[#dbeafe] border-none transition-colors">
                      <Plus size={10} /> {ct.name}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Add custom */}
          <div>
            <p className="text-xs font-bold uppercase text-[#94a3b8] tracking-wider mb-2">Add custom / other</p>
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <input
                  className={inputCls}
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  onFocus={() => setShowSugg(true)}
                  onBlur={() => setTimeout(() => setShowSugg(false), 150)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCert(customName); } }}
                  placeholder="Type a certification name..."
                />
                {showSugg && customName && (
                  <div className="absolute top-full left-0 right-0 z-20 bg-white border border-[#e2e8f0] rounded-[8px] shadow-lg mt-1 max-h-40 overflow-y-auto">
                    {available.filter(n => n.toLowerCase().includes(customName.toLowerCase())).map(n => (
                      <button key={n} type="button" onMouseDown={() => addCert(n)}
                        className="w-full text-left px-3 py-2 text-sm text-[#334155] hover:bg-[#f1f5f9] border-none bg-transparent cursor-pointer">{n}</button>
                    ))}
                  </div>
                )}
              </div>
              <button type="button" onClick={() => addCert(customName)}
                className="px-3 py-2 bg-primary text-white text-sm font-bold rounded-[8px] border-none cursor-pointer hover:opacity-90 whitespace-nowrap shrink-0">
                Add
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#f1f5f9] flex justify-end gap-3 bg-[#fafafa]">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-[#64748b] bg-[#f1f5f9] border-none rounded-[8px] cursor-pointer hover:bg-[#e2e8f0]">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-primary border-none rounded-[8px] cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? 'Saving...' : <><CheckCircle2 size={14} /> Save Requirements</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const CategoryManagement: React.FC = () => {
  const {
    categories, loading, newCategory, setNewCategory,
    subcategories, setSubcategories, isSaving, loadingAction,
    modalOpen, setModalOpen, modalTitle, modalValue, setModalValue,
    handleCreateCategory, handleDeleteCategory, openModal,
    handleModalSubmit, handleDeleteSubcategory, refetchCategories,
  } = useCategoryManagement();

  const [certTypes, setCertTypes] = useState<CertificationType[]>([]);
  const [certModal, setCertModal] = useState<any | null>(null); // category being configured
  const [currentPage, setCurrentPage] = React.useState(1);
  const ITEMS_PER_PAGE = 5;
  const pagedCategories = categories.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const loadCertTypes = async () => {
    try {
      const res = await categoryService.getCertTypes();
      if (res.success) setCertTypes(res.data);
    } catch { /* ignore */ }
  };

  useEffect(() => { loadCertTypes(); }, []);

  if (loading && categories.length === 0) return <div className="py-8 text-center text-sm text-[#64748b]">Loading Categories...</div>;

  return (
    <div className="flex flex-col gap-6">

      {/* Certification Types Manager */}
      <CertTypesPanel certTypes={certTypes} onRefresh={loadCertTypes} />

      {/* Create Category */}
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

      {/* Categories Table */}
      <div className="bg-white rounded-[10px] border border-[#eef2f6] shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="w-full">
          <table className="w-full border-collapse max-md:block">
            <thead className="max-md:hidden">
              <tr>
                <th className={thCls}>Category</th>
                <th className={thCls}>Subcategories</th>
                <th className={thCls}>Certifications Required</th>
                <th className={thCls + " text-right"}>Actions</th>
              </tr>
            </thead>
            <tbody className="max-md:block">
              {pagedCategories.map(c => {
                const reqCerts = (c as any).requiredCertifications || [];
                return (
                  <tr key={c._id} className={trCls}>
                    <td className={tdCls + " font-semibold"}><span className="md:hidden font-bold text-xs text-[#94a3b8] uppercase">Category</span> {c.name}</td>
                    <td className={tdCls}>
                      <span className="md:hidden font-bold text-xs text-[#94a3b8] uppercase">Subcategories</span>
                      <div className="flex flex-wrap gap-2 items-center justify-end md:justify-start">
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
                      <span className="md:hidden font-bold text-xs text-[#94a3b8] uppercase">Certifications</span>
                      <div className="flex flex-wrap gap-1.5 items-center justify-end md:justify-start">
                        {reqCerts.length === 0 ? (
                          <span className="text-xs text-[#94a3b8]">None</span>
                        ) : (
                          reqCerts.map((rc: any, i: number) => (
                            <span key={i} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${rc.mandatory ? 'bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]' : 'bg-[#f0fdf4] text-[#15803d] border border-[#86efac]'}`}>
                              <ShieldCheck size={9} />
                              {rc.name}
                              {rc.mandatory ? '' : ' (opt)'}
                            </span>
                          ))
                        )}
                        <button
                          type="button"
                          onClick={() => setCertModal(c)}
                          className="inline-flex items-center gap-1 bg-white border border-dashed border-[#93c5fd] text-xs text-[#2563eb] px-2.5 py-1 rounded-full cursor-pointer hover:border-[#2563eb] hover:bg-[#eff6ff] transition-colors"
                        >
                          <ShieldCheck size={10} /> {reqCerts.length ? 'Edit' : 'Set'}
                        </button>
                      </div>
                    </td>
                    <td className={tdCls}>
                      <span className="md:hidden font-bold text-xs text-[#94a3b8] uppercase">Actions</span>
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
                );
              })}
              {categories.length === 0 && (
                <tr className="max-md:block max-md:p-4"><td colSpan={4} className="px-4 py-8 text-center text-sm text-[#64748b] max-md:block max-md:p-0">No categories found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination totalItems={categories.length} itemsPerPage={ITEMS_PER_PAGE} currentPage={currentPage} onPageChange={setCurrentPage} />
      </div>

      {/* Name edit modal (existing) */}
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

      {/* Certification config modal */}
      {certModal && (
        <CertConfigModal
          category={certModal}
          certTypes={certTypes}
          onClose={() => setCertModal(null)}
          onSaved={() => {
            setCertModal(null);
            refetchCategories();
          }}
        />
      )}
    </div>
  );
};

export default CategoryManagement;
