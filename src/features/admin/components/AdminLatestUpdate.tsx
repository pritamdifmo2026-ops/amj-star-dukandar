import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/client';
import toast from 'react-hot-toast';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import { Trash2, Edit2, Plus, Image as ImageIcon } from 'lucide-react';

export interface ILatestUpdate {
  _id: string;
  image: string;
  tag: string;
  dateText: string;
  title: string;
  description: string;
  link: string;
  buttonText: string;
  isActive: boolean;
}

const AdminLatestUpdate: React.FC = () => {
  const queryClient = useQueryClient();
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    tag: '',
    dateText: '',
    link: '',
    buttonText: 'Apply',
    isActive: true
  });
  
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: updates, isLoading } = useQuery({
    queryKey: ['adminLatestUpdates'],
    queryFn: async () => {
      const res = await api.get('/latest-updates/admin');
      return res.data.data as ILatestUpdate[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<ILatestUpdate>) => {
      const res = await api.post('/latest-updates/admin', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Latest Update created successfully');
      queryClient.invalidateQueries({ queryKey: ['adminLatestUpdates'] });
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; update: Partial<ILatestUpdate> }) => {
      const res = await api.put(`/latest-updates/admin/${data.id}`, data.update);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Latest Update updated successfully');
      queryClient.invalidateQueries({ queryKey: ['adminLatestUpdates'] });
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/latest-updates/admin/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Latest Update deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['adminLatestUpdates'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete');
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      tag: '',
      dateText: '',
      link: '',
      buttonText: 'Apply',
      isActive: true
    });
    setImagePreview('');
    setImageFile(null);
    setIsEditing(false);
    setCurrentId(null);
  };

  const handleEdit = (update: ILatestUpdate) => {
    setForm({
      title: update.title,
      description: update.description,
      tag: update.tag,
      dateText: update.dateText,
      link: update.link,
      buttonText: update.buttonText,
      isActive: update.isActive
    });
    setImagePreview(update.image);
    setCurrentId(update._id);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this update?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSave = async () => {
    if (!form.title || !form.description) {
      toast.error('Title and description are required');
      return;
    }

    try {
      setUploading(true);
      let imageUrl = imagePreview;

      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const uploadRes = await api.post('/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60000 // Allow up to 60s for image uploads
        });
        imageUrl = uploadRes.data.url;
      }

      if (!imageUrl && !isEditing) {
         toast.error('An image is required');
         setUploading(false);
         return;
      }

      const payload = { ...form, image: imageUrl };

      if (isEditing && currentId) {
        await updateMutation.mutateAsync({ id: currentId, update: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save latest update');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-[12px] border border-[#e2e8f0] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-heading flex items-center gap-2">
            {isEditing ? <Edit2 size={20} /> : <Plus size={20} />}
            {isEditing ? 'Edit Latest Update' : 'Create New Update'}
          </h3>
          {isEditing && (
            <Button variant="secondary" onClick={resetForm} size="sm">
              Cancel Edit
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-4">
            <Input label="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Oprater Technician" required fullWidth />
            <Input label="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="e.g. Exciting opportunity for..." required fullWidth />
          </div>

          <div className="flex flex-col gap-4">
            <label className="text-sm font-semibold text-heading block">Banner Image</label>
            <div className="group border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary-soft/10 rounded-xl flex flex-col items-center justify-center min-h-[200px] relative bg-gray-50 overflow-hidden transition-all">
              <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" title="" />
              
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover absolute inset-0" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-0">
                     <span className="text-white font-bold flex items-center gap-2 bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm"><Edit2 size={16} /> Click to change</span>
                  </div>
                  <button 
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImagePreview(''); setImageFile(null); }}
                    className="absolute top-3 right-3 bg-white text-red-500 rounded-full p-2 shadow-md hover:bg-red-50 hover:scale-110 transition-all z-20 border border-gray-100"
                    title="Remove Image"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              ) : (
                <div className="text-center p-6 pointer-events-none relative z-0">
                  <div className="w-14 h-14 bg-white rounded-full shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-3 text-primary group-hover:scale-110 transition-transform">
                    <ImageIcon size={24} />
                  </div>
                  <p className="font-bold text-heading text-[15px] mb-1">Upload banner image</p>
                  <p className="text-xs text-body">Drag & drop or click to browse</p>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 mt-2">
               <input 
                 type="checkbox" 
                 id="isActive" 
                 checked={form.isActive} 
                 onChange={e => setForm({...form, isActive: e.target.checked})} 
                 className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-300"
               />
               <label htmlFor="isActive" className="text-sm text-slate-700 cursor-pointer">Active (Visible on website)</label>
            </div>
            
            <div className="mt-auto pt-4 flex justify-end">
              <Button 
                onClick={handleSave} 
                isLoading={uploading || createMutation.isPending || updateMutation.isPending}
                disabled={uploading || createMutation.isPending || updateMutation.isPending}
              >
                {isEditing ? 'Save Changes' : 'Create Update'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[12px] border border-[#e2e8f0] p-6 shadow-sm">
        <h3 className="text-lg font-bold text-heading mb-6">Existing Updates</h3>
        {isLoading ? (
          <p className="text-sm text-slate-500 text-center py-4">Loading...</p>
        ) : !updates || updates.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">No updates found. Create one above.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {updates.map(update => (
              <div key={update._id} className={`bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col transition-all ${!update.isActive ? 'opacity-60 grayscale' : 'hover:shadow-md hover:border-slate-300'}`}>
                <div className="h-28 bg-slate-100 relative group">
                  <img src={update.image} alt={update.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  {!update.isActive && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[1px]">
                      <span className="bg-white text-slate-800 px-2 py-1 rounded text-[10px] font-bold tracking-wider">INACTIVE</span>
                    </div>
                  )}
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <h4 className="font-bold text-sm text-slate-800 line-clamp-1 mb-1">{update.title}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mb-3 leading-relaxed">{update.description}</p>
                  
                  <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => updateMutation.mutate({ id: update._id, update: { isActive: true } })}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-colors border ${update.isActive ? 'bg-green-500 text-white border-green-600' : 'bg-white text-green-600 border-green-200 hover:bg-green-50'}`}
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => updateMutation.mutate({ id: update._id, update: { isActive: false } })}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-colors border ${!update.isActive ? 'bg-red-500 text-white border-red-600' : 'bg-white text-red-600 border-red-200 hover:bg-red-50'}`}
                      >
                        Reject
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEdit(update)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded transition-colors" title="Edit Update">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(update._id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Delete Update">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLatestUpdate;
