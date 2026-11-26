import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/client';
import toast from 'react-hot-toast';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import { Trash2, Edit2, Plus, Image as ImageIcon, Link2, Play, Upload, Video } from 'lucide-react';
import { uploadVideoInChunks } from '@/shared/utils/chunkedVideoUpload';
import { isSupportedVideoUrl } from '@/shared/utils/videoEmbed';
import VideoEmbed from '@/shared/components/VideoEmbed';

export interface ILatestUpdate {
  _id: string;
  image: string;
  videoUrl?: string;
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

  // Video is optional: either a pasted YouTube/Vimeo link or a file uploaded to Cloudinary.
  const [videoMode, setVideoMode] = useState<'link' | 'upload'>('link');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoProgress, setVideoProgress] = useState<number | null>(null);

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

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      toast.error('Please choose a video file');
      return;
    }
    setVideoFile(file);
    setVideoUrl('');
  };

  const clearVideo = () => {
    setVideoFile(null);
    setVideoUrl('');
    setVideoProgress(null);
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
    clearVideo();
    setVideoMode('link');
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
    setVideoUrl(update.videoUrl || '');
    setVideoFile(null);
    setVideoProgress(null);
    setVideoMode('link');
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

    if (videoMode === 'link' && videoUrl.trim() && !isSupportedVideoUrl(videoUrl)) {
      toast.error('Paste a YouTube or Vimeo link, or a direct .mp4 URL');
      return;
    }

    try {
      setUploading(true);
      let imageUrl = imagePreview;
      let finalVideoUrl = videoMode === 'link' ? videoUrl.trim() : videoUrl;

      if (videoFile) {
        setVideoProgress(0);
        finalVideoUrl = await uploadVideoInChunks(videoFile, p => setVideoProgress(p.percent));
        setVideoUrl(finalVideoUrl);
        setVideoFile(null);
      }

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

      const payload = { ...form, image: imageUrl, videoUrl: finalVideoUrl };

      if (isEditing && currentId) {
        await updateMutation.mutateAsync({ id: currentId, update: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error?.message || 'Failed to save latest update');
    } finally {
      setUploading(false);
      setVideoProgress(null);
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
            {/* Multi-line: the update modal renders this with whitespace-pre-line, so line breaks are kept. */}
            <div className="flex flex-col gap-1 w-full">
              <label htmlFor="update-description" className="text-sm font-medium text-body">Description</label>
              <div className="flex border border-border bg-[oklch(0.99_0.01_80)] rounded-[4px] transition-colors duration-150 focus-within:border-primary">
                <textarea
                  id="update-description"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. Exciting opportunity for..."
                  rows={6}
                  required
                  className="flex-1 min-w-0 border-none outline-none bg-transparent px-2.5 py-[6.5px] text-[14.5px] text-heading placeholder:text-muted resize-y leading-relaxed"
                />
              </div>
              <span className="text-[11px] text-body">Line breaks are preserved on the website.</span>
            </div>
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
            
            {/* Optional video — shown in place of the image when the update is opened */}
            <div className="flex flex-col gap-3 mt-2 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <label className="text-sm font-semibold text-heading flex items-center gap-2">
                  <Video size={16} /> Video <span className="text-xs font-normal text-body">(optional)</span>
                </label>
                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => { setVideoMode('link'); setVideoFile(null); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${videoMode === 'link' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Link2 size={13} /> Paste link
                  </button>
                  <button
                    type="button"
                    onClick={() => { setVideoMode('upload'); setVideoUrl(''); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${videoMode === 'upload' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Upload size={13} /> Upload file
                  </button>
                </div>
              </div>

              {videoMode === 'link' ? (
                <>
                  <Input
                    label=""
                    value={videoUrl}
                    onChange={e => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                    fullWidth
                  />
                  <p className="text-[11px] text-body">
                    YouTube, Vimeo or a direct .mp4 link. Recommended — costs no storage and loads faster.
                  </p>
                </>
              ) : (
                <>
                  <div className="relative border-2 border-dashed border-gray-300 hover:border-primary rounded-xl bg-gray-50 px-4 py-5 text-center transition-colors">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      title=""
                    />
                    <p className="text-sm font-bold text-heading">
                      {videoFile ? videoFile.name : 'Choose a video file'}
                    </p>
                    <p className="text-[11px] text-body mt-1">
                      {videoFile
                        ? `${(videoFile.size / (1024 * 1024)).toFixed(1)} MB — uploads when you save`
                        : 'MP4 or WebM, up to 40 MB'}
                    </p>
                  </div>
                  {videoProgress !== null && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{ width: `${videoProgress}%` }} />
                      </div>
                      <span className="text-[11px] font-bold text-body shrink-0">{videoProgress}%</span>
                    </div>
                  )}
                </>
              )}

              {/* Preview only once the URL is actually playable, so no empty black box appears. */}
              {videoUrl && !videoFile && isSupportedVideoUrl(videoUrl) && (
                <div className="flex flex-col gap-2">
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black border border-slate-200">
                    <VideoEmbed url={videoUrl} title="Video preview" poster={imagePreview} />
                  </div>
                  <button
                    type="button"
                    onClick={clearVideo}
                    className="self-start text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1.5"
                  >
                    <Trash2 size={13} /> Remove video
                  </button>
                </div>
              )}

              {videoMode === 'link' && videoUrl.trim() && !isSupportedVideoUrl(videoUrl) && (
                <p className="text-[11px] font-semibold text-[#dc2626]">
                  Not a recognised video link — use YouTube, Vimeo or a direct .mp4 URL.
                </p>
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
                loading={uploading || createMutation.isPending || updateMutation.isPending}
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
                  {update.videoUrl && (
                    <span className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-black/70 text-white rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                      <Play size={9} fill="currentColor" /> Video
                    </span>
                  )}
                  {!update.isActive && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[1px]">
                      <span className="bg-white text-slate-800 px-2 py-1 rounded text-[10px] font-bold tracking-wider">HIDDEN</span>
                    </div>
                  )}
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <h4 className="font-bold text-sm text-slate-800 line-clamp-1 mb-1">{update.title}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mb-3 leading-relaxed">{update.description}</p>
                  
                  <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                    {/* Visibility only — these updates are written by admin, so there is nothing to approve. */}
                    <button
                      onClick={() => updateMutation.mutate({ id: update._id, update: { isActive: !update.isActive } })}
                      title={update.isActive ? 'Visible on the website — click to hide' : 'Hidden from the website — click to show'}
                      aria-pressed={update.isActive}
                      className="flex items-center gap-1.5 group/toggle cursor-pointer bg-transparent border-none p-0"
                    >
                      <span className={`relative w-7 h-4 rounded-full transition-colors shrink-0 ${update.isActive ? 'bg-green-500' : 'bg-slate-300'}`}>
                        <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${update.isActive ? 'left-3.5' : 'left-0.5'}`} />
                      </span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${update.isActive ? 'text-green-600' : 'text-slate-400'}`}>
                        {update.isActive ? 'Visible' : 'Hidden'}
                      </span>
                    </button>
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
