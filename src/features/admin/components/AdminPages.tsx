import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FileText, Edit2, Check, X, ChevronLeft, Plus,
  Trash2, Image as ImageIcon, AlignLeft, Heading, Type, Upload, Loader2,
  Eye, ShieldCheck, TrendingUp, Handshake,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/api/client';
import adminService from '../services/admin.service';

// ── Types ─────────────────────────────────────────────────────────────────────

type SectionType =
  | 'hero' | 'heading' | 'paragraph' | 'image'
  | 'about-hero' | 'about-story' | 'about-values';

interface Section {
  id: string;
  type: string;
  heading?: string;
  subheading?: string;
  body?: string;
  text?: string;
  level?: 2 | 3;
  url?: string;
  alt?: string;
  caption?: string;
  meta?: Record<string, string>;
}

interface PageData {
  slug: string;
  title: string;
  sections: Section[];
  updatedAt?: string;
}

const PAGE_LIST = [
  { slug: 'about',   label: 'About Us',           desc: 'Company story, mission & values', path: '/about'   },
  { slug: 'terms',   label: 'Terms & Conditions', desc: 'Platform usage terms',             path: '/terms'   },
  { slug: 'privacy', label: 'Privacy Policy',     desc: 'How we handle user data',          path: '/privacy' },
];

// ── Live section renderer ─────────────────────────────────────────────────────

const RenderSection: React.FC<{ s: Section }> = ({ s }) => {
  // ── about-hero ──────────────────────────────────────────────────────────────
  if (s.type === 'about-hero') {
    const m = s.meta ?? {};
    return (
      <div className="bg-[#faf8f5] rounded-[14px] overflow-hidden">
        <div className="px-8 py-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            {s.subheading && (
              <span className="inline-block px-4 py-1.5 bg-orange-50 text-primary rounded-full text-sm font-bold mb-4">{s.subheading}</span>
            )}
            <h1 className="text-3xl font-extrabold text-[#0f172a] leading-tight mb-4">
              {s.heading} <span className="text-primary">{m.headingHighlight}</span> {m.headingSuffix}
            </h1>
            {s.body && <p className="text-[#475569] text-sm leading-relaxed mb-5">{s.body}</p>}
            <div className="flex items-center gap-4">
              {m.primaryCta && <span className="px-5 py-2.5 bg-primary text-white font-bold rounded-[8px] text-sm">{m.primaryCta}</span>}
            </div>
          </div>
          <div className="rounded-[14px] overflow-hidden">
            {s.url ? (
              <img src={s.url} alt={m.heroAlt ?? ''} className="w-full object-cover max-h-[320px]" />
            ) : (
              <div className="min-h-[200px] bg-[#f1f5f9] border-2 border-dashed border-[#e2e8f0] rounded-[14px] flex flex-col items-center justify-center gap-2 text-[#94a3b8]">
                <ImageIcon size={28} className="opacity-40" />
                <span className="text-xs">No image — click pencil to upload</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── about-story ─────────────────────────────────────────────────────────────
  if (s.type === 'about-story') {
    const m = s.meta ?? {};
    return (
      <div className="bg-white rounded-[14px] px-8 py-10 border border-[#eef2f6]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-2xl font-extrabold text-[#0f172a] mb-5">{s.heading}</h2>
            {s.text && <p className="text-[#475569] text-sm leading-[1.9] mb-4">{s.text}</p>}
            {s.body && <p className="text-[#475569] text-sm leading-[1.9]">{s.body}</p>}
          </div>
          <div className="bg-[#fafafa] border border-[#eef2f6] rounded-[14px] p-7">
            {m.quoteText && (
              <p className="text-[#1e293b] text-sm font-medium leading-relaxed italic mb-6">"{m.quoteText}"</p>
            )}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-xs font-extrabold shrink-0">
                {m.quoteInitials ?? 'AV'}
              </div>
              <div>
                <p className="font-bold text-[#0f172a] text-sm">{m.quoteAuthor}</p>
                <p className="text-xs text-[#94a3b8]">{m.quoteRole}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── about-values ────────────────────────────────────────────────────────────
  if (s.type === 'about-values') {
    const m = s.meta ?? {};
    const cards = [
      { icon: <ShieldCheck size={20} className="text-primary" />, title: m.v1Title ?? 'Value 1', desc: m.v1Desc ?? '' },
      { icon: <TrendingUp  size={20} className="text-primary" />, title: m.v2Title ?? 'Value 2', desc: m.v2Desc ?? '' },
      { icon: <Handshake   size={20} className="text-primary" />, title: m.v3Title ?? 'Value 3', desc: m.v3Desc ?? '' },
    ];
    return (
      <div className="bg-[#f8f7f4] rounded-[14px] px-8 py-10">
        <h2 className="text-2xl font-extrabold text-[#0f172a] text-center mb-8">{s.heading}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {cards.map((c, i) => (
            <div key={i} className="bg-white rounded-[12px] border border-[#eef2f6] p-6">
              <div className="w-10 h-10 rounded-[8px] bg-orange-50 flex items-center justify-center mb-4">{c.icon}</div>
              <h3 className="font-extrabold text-[#0f172a] text-sm mb-2">{c.title}</h3>
              <p className="text-[#64748b] text-xs leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── generic types ────────────────────────────────────────────────────────────
  if (s.type === 'hero') return (
    <div className="bg-gradient-to-br from-white to-[oklch(0.97_0.02_75)] rounded-[14px] px-8 py-12 border border-[#eef2f6] text-center">
      {s.subheading && (
        <span className="inline-block px-4 py-1.5 bg-orange-50 text-primary rounded-full text-sm font-bold mb-4">{s.subheading}</span>
      )}
      {s.heading && (
        <h1 className="text-3xl font-extrabold text-[#0f172a] leading-tight mb-4">{s.heading}</h1>
      )}
      {s.body && (
        <p className="text-[#475569] text-sm leading-relaxed max-w-xl mx-auto">{s.body}</p>
      )}
    </div>
  );

  if (s.type === 'heading') {
    const Tag = (s.level === 3 ? 'h3' : 'h2') as 'h2' | 'h3';
    return (
      <Tag className={`font-extrabold text-[#0f172a] ${s.level === 3 ? 'text-lg' : 'text-2xl border-b border-[#f1f5f9] pb-3'}`}>
        {s.text || <span className="text-[#94a3b8] italic font-normal text-base">Empty heading…</span>}
      </Tag>
    );
  }

  if (s.type === 'paragraph') return (
    <p className="text-[#475569] text-sm leading-[1.85]">
      {s.text || <span className="text-[#94a3b8] italic">Empty paragraph…</span>}
    </p>
  );

  if (s.type === 'image') return (
    <figure className="flex flex-col items-center gap-2">
      {s.url
        ? <img src={s.url} alt={s.alt || ''} className="w-full max-h-[320px] object-cover rounded-[10px] shadow-sm" />
        : <div className="w-full h-32 rounded-[10px] bg-[#f1f5f9] border-2 border-dashed border-[#e2e8f0] flex items-center justify-center text-[#94a3b8] text-xs">No image set</div>
      }
      {s.caption && <figcaption className="text-xs text-[#94a3b8] text-center">{s.caption}</figcaption>}
    </figure>
  );

  return null;
};

// ── Section edit form ─────────────────────────────────────────────────────────

const SectionEditForm: React.FC<{
  section: Section;
  onChange: (s: Section) => void;
  onDone: () => void;
}> = ({ section, onChange, onDone }) => {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof Section, value: unknown) => onChange({ ...section, [key]: value });
  const setMeta = (key: string, value: string) =>
    onChange({ ...section, meta: { ...(section.meta ?? {}), [key]: value } });

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await adminService.uploadImage(file);
      set('url', url);
      toast.success('Image uploaded');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const inputCls = "w-full px-3 py-2 rounded-[8px] border border-[#e2e8f0] focus:border-[#0284c7] text-sm outline-none transition-colors bg-white";
  const labelCls = "block text-[10px] font-bold uppercase tracking-wide text-[#94a3b8] mb-1.5";
  const m = section.meta ?? {};

  return (
    <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-[10px] p-4 flex flex-col gap-3 mt-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-extrabold text-[#0284c7] uppercase tracking-wide">Editing: {section.type}</span>
        <button onClick={onDone} className="flex items-center gap-1 text-xs font-bold text-[#0284c7] cursor-pointer bg-transparent border-none hover:text-[#0369a1]">
          <Check size={13} /> Done
        </button>
      </div>

      {/* ── about-hero ───────────────────────────────────────────────────── */}
      {section.type === 'about-hero' && (
        <>
          <div>
            <label className={labelCls}>Hero Image</label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
            {section.url && (
              <img src={section.url} alt="" className="w-full max-h-28 object-cover rounded-[8px] mb-2" />
            )}
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              className="flex items-center gap-2 px-3 py-2 rounded-[8px] border border-dashed border-[#0284c7] text-[#0284c7] text-xs font-semibold cursor-pointer hover:bg-white transition-colors disabled:opacity-50 w-full justify-center"
            >
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              {uploading ? 'Uploading…' : section.url ? 'Replace Image' : 'Upload Image'}
            </button>
            <p className="text-[10px] text-[#94a3b8] mt-2 mb-1">Or paste URL:</p>
            <input className={inputCls} value={section.url ?? ''} onChange={e => set('url', e.target.value)} placeholder="https://…" />
          </div>
          <div><label className={labelCls}>Image Alt Text</label>
            <input className={inputCls} value={m.heroAlt ?? ''} onChange={e => setMeta('heroAlt', e.target.value)} placeholder="Describe the image" /></div>
          <div className="border-t border-[#bae6fd] pt-3">
          <div><label className={labelCls}>Pill Tag</label>
            <input className={inputCls} value={section.subheading ?? ''} onChange={e => set('subheading', e.target.value)} placeholder="Our Journey" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className={labelCls}>Heading Start</label>
              <input className={inputCls} value={section.heading ?? ''} onChange={e => set('heading', e.target.value)} placeholder="Redefining" /></div>
            <div><label className={labelCls}>Highlight (orange)</label>
              <input className={inputCls} value={m.headingHighlight ?? ''} onChange={e => setMeta('headingHighlight', e.target.value)} placeholder="B2B Commerce" /></div>
            <div><label className={labelCls}>Heading End</label>
              <input className={inputCls} value={m.headingSuffix ?? ''} onChange={e => setMeta('headingSuffix', e.target.value)} placeholder="for the Digital Age" /></div>
          </div>
          <div><label className={labelCls}>Description</label>
            <textarea className={inputCls} rows={3} value={section.body ?? ''} onChange={e => set('body', e.target.value)} placeholder="Supporting description…" /></div>
          <div><label className={labelCls}>Button Label</label>
            <input className={inputCls} value={m.primaryCta ?? ''} onChange={e => setMeta('primaryCta', e.target.value)} placeholder="Our Mission" /></div>
          </div>
        </>
      )}

      {/* ── about-story ──────────────────────────────────────────────────── */}
      {section.type === 'about-story' && (
        <>
          <div><label className={labelCls}>Section Title</label>
            <input className={inputCls} value={section.heading ?? ''} onChange={e => set('heading', e.target.value)} placeholder="Our Story" /></div>
          <div><label className={labelCls}>Paragraph 1</label>
            <textarea className={inputCls} rows={4} value={section.text ?? ''} onChange={e => set('text', e.target.value)} /></div>
          <div><label className={labelCls}>Paragraph 2</label>
            <textarea className={inputCls} rows={4} value={section.body ?? ''} onChange={e => set('body', e.target.value)} /></div>
          <div className="border-t border-[#bae6fd] pt-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#0284c7] mb-3">Founder Quote Card</p>
            <div><label className={labelCls}>Quote Text</label>
              <textarea className={inputCls} rows={3} value={m.quoteText ?? ''} onChange={e => setMeta('quoteText', e.target.value)} /></div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div><label className={labelCls}>Initials</label>
                <input className={inputCls} value={m.quoteInitials ?? ''} onChange={e => setMeta('quoteInitials', e.target.value)} placeholder="AV" /></div>
              <div><label className={labelCls}>Author Name</label>
                <input className={inputCls} value={m.quoteAuthor ?? ''} onChange={e => setMeta('quoteAuthor', e.target.value)} placeholder="Founder's Vision" /></div>
              <div><label className={labelCls}>Role</label>
                <input className={inputCls} value={m.quoteRole ?? ''} onChange={e => setMeta('quoteRole', e.target.value)} placeholder="CEO, AMJSTAR" /></div>
            </div>
          </div>
        </>
      )}

      {/* ── about-values ─────────────────────────────────────────────────── */}
      {section.type === 'about-values' && (
        <>
          <div><label className={labelCls}>Section Title</label>
            <input className={inputCls} value={section.heading ?? ''} onChange={e => set('heading', e.target.value)} placeholder="Our Core Values" /></div>
          {(['v1', 'v2', 'v3'] as const).map((v, i) => (
            <div key={v} className="bg-white rounded-[8px] p-3 border border-[#e2e8f0]">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#64748b] mb-2">Value {i + 1}</p>
              <div className="flex flex-col gap-2">
                <input className={inputCls} value={m[`${v}Title`] ?? ''} onChange={e => setMeta(`${v}Title`, e.target.value)} placeholder={`Value ${i + 1} title`} />
                <textarea className={inputCls} rows={2} value={m[`${v}Desc`] ?? ''} onChange={e => setMeta(`${v}Desc`, e.target.value)} placeholder="Description…" />
              </div>
            </div>
          ))}
        </>
      )}

      {/* ── generic hero ─────────────────────────────────────────────────── */}
      {section.type === 'hero' && (
        <>
          <div><label className={labelCls}>Tag / Subheading</label>
            <input className={inputCls} value={section.subheading ?? ''} onChange={e => set('subheading', e.target.value)} placeholder="e.g. Our Journey" /></div>
          <div><label className={labelCls}>Main Heading</label>
            <input className={inputCls} value={section.heading ?? ''} onChange={e => set('heading', e.target.value)} placeholder="Hero heading" /></div>
          <div><label className={labelCls}>Body Text</label>
            <textarea className={inputCls} rows={3} value={section.body ?? ''} onChange={e => set('body', e.target.value)} placeholder="Supporting description" /></div>
        </>
      )}

      {section.type === 'heading' && (
        <>
          <div><label className={labelCls}>Heading Text</label>
            <input className={inputCls} value={section.text ?? ''} onChange={e => set('text', e.target.value)} placeholder="Section heading" /></div>
          <div><label className={labelCls}>Size</label>
            <select className={inputCls} value={section.level ?? 2} onChange={e => set('level', Number(e.target.value))}>
              <option value={2}>H2 — Large section title</option>
              <option value={3}>H3 — Sub-section title</option>
            </select>
          </div>
        </>
      )}

      {section.type === 'paragraph' && (
        <div><label className={labelCls}>Text</label>
          <textarea className={inputCls} rows={5} value={section.text ?? ''} onChange={e => set('text', e.target.value)} placeholder="Paragraph text…" /></div>
      )}

      {section.type === 'image' && (
        <>
          <div>
            <label className={labelCls}>Image</label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              className="flex items-center gap-2 px-3 py-2 rounded-[8px] border border-dashed border-[#0284c7] text-[#0284c7] text-xs font-semibold cursor-pointer hover:bg-white transition-colors disabled:opacity-50 w-full justify-center"
            >
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              {uploading ? 'Uploading…' : section.url ? 'Replace Image' : 'Upload Image'}
            </button>
            <p className="text-[10px] text-[#94a3b8] mt-2 mb-1">Or paste URL:</p>
            <input className={inputCls} value={section.url ?? ''} onChange={e => set('url', e.target.value)} placeholder="https://…" />
          </div>
          <div><label className={labelCls}>Alt Text</label>
            <input className={inputCls} value={section.alt ?? ''} onChange={e => set('alt', e.target.value)} placeholder="Describe the image" /></div>
          <div><label className={labelCls}>Caption (optional)</label>
            <input className={inputCls} value={section.caption ?? ''} onChange={e => set('caption', e.target.value)} placeholder="Caption shown below image" /></div>
        </>
      )}
    </div>
  );
};

// ── Editable section wrapper ──────────────────────────────────────────────────

const EditableSection: React.FC<{
  s: Section;
  isEditing: boolean;
  onToggleEdit: () => void;
  onUpdate: (s: Section) => void;
  onDelete: () => void;
}> = ({ s, isEditing, onToggleEdit, onUpdate, onDelete }) => (
  <div className={`relative group rounded-[10px] transition-all ${isEditing ? 'ring-2 ring-[#0284c7] ring-offset-2' : ''}`}>
    <div className="px-1 py-1">
      <RenderSection s={s} />
    </div>

    {!isEditing && (
      <div className="absolute inset-0 rounded-[10px] border-2 border-transparent group-hover:border-[#0284c7] pointer-events-none transition-colors" />
    )}

    <div className={`absolute top-2 right-2 flex items-center gap-1 z-10 transition-opacity ${isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
      <span className="text-[9px] font-extrabold bg-[#0284c7] text-white px-1.5 py-0.5 rounded uppercase tracking-wide select-none">
        {s.type}
      </span>
      <button
        onClick={onToggleEdit}
        className={`w-6 h-6 flex items-center justify-center rounded-[5px] shadow-sm border cursor-pointer transition-colors ${
          isEditing
            ? 'bg-[#0284c7] border-[#0284c7] text-white'
            : 'bg-white border-[#e2e8f0] text-[#0284c7] hover:bg-[#eff6ff]'
        }`}
      >
        {isEditing ? <X size={11} /> : <Edit2 size={11} />}
      </button>
      <button
        onClick={onDelete}
        className="w-6 h-6 flex items-center justify-center rounded-[5px] bg-white border border-[#e2e8f0] text-[#ef4444] shadow-sm cursor-pointer hover:bg-red-50 transition-colors"
      >
        <Trash2 size={11} />
      </button>
    </div>

    {isEditing && (
      <div className="px-1">
        <SectionEditForm section={s} onChange={onUpdate} onDone={onToggleEdit} />
      </div>
    )}
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────

const AdminPages: React.FC = () => {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [pageTitle, setPageTitle] = useState('');
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [addingType, setAddingType] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);

  const { data: pageData, isLoading } = useQuery<PageData>({
    queryKey: ['admin', 'page', editing],
    queryFn: async () => {
      const res = await api.get(`/pages/${editing}`);
      return res.data.page;
    },
    enabled: !!editing,
  });

  useEffect(() => {
    if (pageData) {
      setSections(pageData.sections);
      setPageTitle(pageData.title);
    }
  }, [pageData]);

  const handleOpenEditor = (slug: string) => {
    setEditing(slug);
    setEditingSectionId(null);
  };

  const handleBack = () => {
    setEditing(null);
    setEditingSectionId(null);
    setSections([]);
  };

  const updateSection = (updated: Section) =>
    setSections(prev => prev.map(s => s.id === updated.id ? updated : s));

  const deleteSection = (id: string) => {
    setSections(prev => prev.filter(s => s.id !== id));
    if (editingSectionId === id) setEditingSectionId(null);
  };

  const toggleEdit = (id: string) =>
    setEditingSectionId(prev => prev === id ? null : id);

  const addSection = (type: SectionType) => {
    const newSection: Section = {
      id: `s${Date.now()}`,
      type,
      ...(type === 'heading'   ? { text: 'New Section', level: 2 as const }                      : {}),
      ...(type === 'paragraph' ? { text: '' }                                                       : {}),
      ...(type === 'hero'      ? { heading: 'Heading', subheading: 'Tag', body: 'Description' }    : {}),
      ...(type === 'image'     ? { url: '', alt: '' }                                               : {}),
    };
    setSections(prev => [...prev, newSection]);
    setEditingSectionId(newSection.id);
    setAddingType(false);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await api.put(`/pages/${editing}`, { title: pageTitle, sections });
      qc.invalidateQueries({ queryKey: ['page', editing] });
      setShowPublishConfirm(false);
      handleBack();
      toast.success('Changes published live!');
    } catch {
      toast.error('Failed to save page');
    } finally {
      setSaving(false);
    }
  };

  // ── List view ────────────────────────────────────────────────────────────────

  if (!editing) {
    return (
      <div className="animate-fade-in max-w-3xl">
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold text-[#0f172a]">Pages</h2>
          <p className="text-[#64748b] text-sm mt-1">Click a page to open its live editor. Changes are reflected immediately on the public site after saving.</p>
        </div>
        <div className="flex flex-col gap-4">
          {PAGE_LIST.map(p => (
            <div
              key={p.slug}
              onClick={() => handleOpenEditor(p.slug)}
              className="bg-white border border-[#eef2f6] rounded-[14px] p-5 flex items-center justify-between gap-4 cursor-pointer hover:border-[#0284c7] hover:shadow-[0_0_0_3px_rgba(2,132,199,0.08)] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-[10px] bg-[#eff6ff] flex items-center justify-center shrink-0 group-hover:bg-[#0284c7] transition-colors">
                  <FileText size={18} className="text-[#0284c7] group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="font-bold text-[#0f172a] text-sm">{p.label}</p>
                  <p className="text-xs text-[#94a3b8] mt-0.5">{p.desc} · <span className="font-mono">{p.path}</span></p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={p.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#64748b] border border-[#e2e8f0] rounded-[7px] no-underline hover:border-[#0284c7] hover:text-[#0284c7] transition-colors"
                >
                  <Eye size={12} /> Preview
                </a>
                <span className="flex items-center gap-1 px-3 py-1.5 bg-[#0f172a] text-white text-xs font-bold rounded-[7px]">
                  <Edit2 size={12} /> Edit
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Editor view ──────────────────────────────────────────────────────────────

  const pageInfo = PAGE_LIST.find(p => p.slug === editing)!;

  return (
    <div className="animate-fade-in">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-20 bg-[#f8fafc] border-b border-[#eef2f6] flex items-center justify-between py-3 px-1 mb-6 gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-[#64748b] text-sm font-semibold cursor-pointer bg-transparent border-none hover:text-[#0f172a] transition-colors"
          >
            <ChevronLeft size={18} /> Pages
          </button>
          <span className="text-[#e2e8f0]">/</span>
          <input
            value={pageTitle}
            onChange={e => setPageTitle(e.target.value)}
            className="font-bold text-[#0f172a] text-sm border-none outline-none bg-transparent min-w-0"
          />
        </div>
        <div className="flex items-center gap-2">
          <a
            href={pageInfo.path}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#64748b] border border-[#e2e8f0] rounded-[7px] no-underline hover:border-[#0284c7] hover:text-[#0284c7] transition-colors"
          >
            <Eye size={12} /> View Live
          </a>
          <button
            onClick={() => setShowPublishConfirm(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#059669] text-white text-xs font-bold rounded-[7px] border-none cursor-pointer hover:bg-[#047857] transition-colors"
          >
            <Check size={13} /> Save Page
          </button>
        </div>
      </div>

      {/* Publish confirmation modal */}
      {showPublishConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[18px] shadow-2xl p-7 w-full max-w-sm mx-4">
            <div className="w-12 h-12 rounded-full bg-[#ecfdf5] flex items-center justify-center mb-4">
              <Check size={22} className="text-[#059669]" />
            </div>
            <h3 className="font-extrabold text-[#0f172a] text-lg mb-1">Publish changes?</h3>
            <p className="text-[#64748b] text-sm mb-6 leading-relaxed">
              This will update the <span className="font-semibold text-[#0f172a]">{pageTitle}</span> page immediately. Visitors will see your changes right away.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPublishConfirm(false)}
                className="flex-1 py-2.5 rounded-[10px] border border-[#e2e8f0] text-sm font-semibold text-[#64748b] cursor-pointer hover:bg-[#f8fafc] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-[10px] bg-[#059669] text-white text-sm font-bold cursor-pointer hover:bg-[#047857] disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                {saving ? 'Publishing…' : 'Yes, Publish Live'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live page preview with editable sections */}
      <div className="max-w-[860px] mx-auto">
        {isLoading ? (
          <div className="py-24 flex items-center justify-center gap-2 text-[#94a3b8] text-sm">
            <Loader2 size={18} className="animate-spin" /> Loading page…
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-[#eff6ff] border border-[#bfdbfe] rounded-[8px] text-xs text-[#0284c7] font-medium">
              <Edit2 size={12} /> Hover over any section to edit it. Click the pencil icon to open the editor.
            </div>

            {sections.map(s => (
              <EditableSection
                key={s.id}
                s={s}
                isEditing={editingSectionId === s.id}
                onToggleEdit={() => toggleEdit(s.id)}
                onUpdate={updateSection}
                onDelete={() => deleteSection(s.id)}
              />
            ))}

            {/* Add section — only shown for non-about pages */}
            {editing !== 'about' && (
              addingType ? (
                <div className="bg-white border border-[#eef2f6] rounded-[12px] p-5">
                  <p className="text-xs font-bold text-[#64748b] uppercase tracking-wide mb-3">Add a section</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                    {([
                      { type: 'hero'      as SectionType, label: 'Hero Banner', icon: <Type size={16} /> },
                      { type: 'heading'   as SectionType, label: 'Heading',     icon: <Heading size={16} /> },
                      { type: 'paragraph' as SectionType, label: 'Paragraph',   icon: <AlignLeft size={16} /> },
                      { type: 'image'     as SectionType, label: 'Image',       icon: <ImageIcon size={16} /> },
                    ]).map(({ type, label, icon }) => (
                      <button
                        key={type}
                        onClick={() => addSection(type)}
                        className="flex flex-col items-center gap-2 px-3 py-4 rounded-[8px] border border-[#e2e8f0] text-xs font-semibold text-[#374151] cursor-pointer bg-[#f8fafc] hover:border-[#0284c7] hover:text-[#0284c7] hover:bg-[#eff6ff] transition-all"
                      >
                        {icon} {label}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setAddingType(false)} className="text-xs text-[#94a3b8] cursor-pointer bg-transparent border-none hover:text-[#64748b]">
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAddingType(true)}
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-[12px] border-2 border-dashed border-[#e2e8f0] text-sm font-semibold text-[#94a3b8] cursor-pointer bg-transparent hover:border-[#0284c7] hover:text-[#0284c7] transition-colors"
                >
                  <Plus size={16} /> Add Section
                </button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPages;
