import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Briefcase, Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/api/client';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';

interface Job {
  _id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

const AdminJobs: React.FC = () => {
  const qc = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: '',
    type: 'Full-time',
    description: '',
    isActive: true,
    startDate: '',
    endDate: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ['admin', 'jobs'],
    queryFn: async () => {
      const res = await api.get('/jobs/admin');
      return res.data.jobs;
    },
  });

  const handleOpenModal = (job?: Job) => {
    if (job) {
      setEditingJob(job);
      setFormData({
        title: job.title,
        department: job.department,
        location: job.location,
        type: job.type,
        description: job.description,
        isActive: job.isActive,
        startDate: job.startDate ? new Date(job.startDate).toISOString().split('T')[0] : '',
        endDate: job.endDate ? new Date(job.endDate).toISOString().split('T')[0] : '',
      });
    } else {
      setEditingJob(null);
      setFormData({
        title: '',
        department: '',
        location: '',
        type: 'Full-time',
        description: '',
        isActive: true,
        startDate: '',
        endDate: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingJob(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingJob) {
        await api.put(`/jobs/${editingJob._id}`, formData);
        toast.success('Job updated successfully');
      } else {
        await api.post('/jobs', formData);
        toast.success('Job created successfully');
      }
      qc.invalidateQueries({ queryKey: ['admin', 'jobs'] });
      handleCloseModal();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save job');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;
    try {
      await api.delete(`/jobs/${id}`);
      toast.success('Job deleted successfully');
      qc.invalidateQueries({ queryKey: ['admin', 'jobs'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete job');
    }
  };

  const setStatus = async (job: Job, isActive: boolean) => {
    try {
      await api.put(`/jobs/${job._id}`, { isActive });
      toast.success(`Job marked as ${isActive ? 'Active' : 'Inactive'}`);
      qc.invalidateQueries({ queryKey: ['admin', 'jobs'] });
    } catch {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-heading">Careers Management</h2>
          <p className="text-body text-sm mt-1">Manage job postings available on the careers page.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
          <Plus size={16} /> Add Job
        </Button>
      </div>

      <div className="bg-white rounded-[16px] border border-border overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-body">
            <Loader2 className="animate-spin mb-2" size={24} />
            <p className="text-sm">Loading jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="text-gray-400" size={24} />
            </div>
            <h3 className="text-xl font-bold text-heading mb-2">No jobs posted yet</h3>
            <p className="text-body max-w-md mx-auto text-sm mb-6">
              Create your first job posting to start receiving applications.
            </p>
            <Button onClick={() => handleOpenModal()} className="flex items-center gap-2 mx-auto">
              <Plus size={16} /> Add Job
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-border">
                  <th className="px-6 py-4 text-xs font-bold text-heading uppercase tracking-wide">Job Title</th>
                  <th className="px-6 py-4 text-xs font-bold text-heading uppercase tracking-wide">Department</th>
                  <th className="px-6 py-4 text-xs font-bold text-heading uppercase tracking-wide">Location</th>
                  <th className="px-6 py-4 text-xs font-bold text-heading uppercase tracking-wide">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-heading uppercase tracking-wide text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job._id} className="border-b border-border hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-heading text-sm">{job.title}</div>
                      <div className="text-xs text-body mt-0.5">{job.type}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-body">{job.department}</td>
                    <td className="px-6 py-4 text-sm text-body">{job.location}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => !job.isActive && setStatus(job, true)}
                          className={`px-3 py-1.5 rounded-[6px] text-[10px] font-bold uppercase tracking-wide transition-all cursor-pointer border ${job.isActive ? 'bg-green-500 text-white border-green-600 shadow-sm' : 'bg-white text-green-600 border-green-200 hover:bg-green-50'}`}
                        >
                          Active
                        </button>
                        <button
                          onClick={() => job.isActive && setStatus(job, false)}
                          className={`px-3 py-1.5 rounded-[6px] text-[10px] font-bold uppercase tracking-wide transition-all cursor-pointer border ${!job.isActive ? 'bg-red-500 text-white border-red-600 shadow-sm' : 'bg-white text-red-600 border-red-200 hover:bg-red-50'}`}
                        >
                          Inactive
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(job)}
                          className="w-8 h-8 rounded-[8px] bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors border border-blue-100 cursor-pointer shadow-sm"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(job._id)}
                          className="w-8 h-8 rounded-[8px] bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors border border-red-100 cursor-pointer shadow-sm"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingJob ? 'Edit Job' : 'Add New Job'}
        widthClass="max-w-4xl w-[95%]"
        overlayClassName="md:pl-[250px]"
      >
        <form onSubmit={handleSave} className="flex flex-col gap-4 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-heading uppercase tracking-wide mb-1.5">Job Title</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 rounded-[10px] border border-border focus:border-primary outline-none transition-colors text-sm"
                placeholder="job title"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-heading uppercase tracking-wide mb-1.5">Type</label>
              <select
                className="w-full px-4 py-2.5 rounded-[10px] border border-border focus:border-primary outline-none transition-colors text-sm bg-white"
                value={formData.type}
                onChange={e => setFormData(prev => ({ ...prev, type: e.target.value }))}
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-heading uppercase tracking-wide mb-1.5">Department</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 rounded-[10px] border border-border focus:border-primary outline-none transition-colors text-sm"
                placeholder="Depatment"
                value={formData.department}
                onChange={e => setFormData(prev => ({ ...prev, department: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-heading uppercase tracking-wide mb-1.5">Location</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 rounded-[10px] border border-border focus:border-primary outline-none transition-colors text-sm"
                placeholder="e.g. Remote, Mumbai"
                value={formData.location}
                onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-heading uppercase tracking-wide mb-1.5">Description (Markdown supported)</label>
            <textarea
              required
              rows={3}
              className="w-full px-4 py-2.5 rounded-[10px] border border-border focus:border-primary outline-none transition-colors text-sm resize-y"
              placeholder="Enter job description, requirements, and responsibilities..."
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-heading uppercase tracking-wide mb-1.5">Start Date (Optional)</label>
              <input
                type="date"
                className="w-full px-4 py-2.5 rounded-[10px] border border-border focus:border-primary outline-none transition-colors text-sm"
                value={formData.startDate}
                onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-heading uppercase tracking-wide mb-1.5">End Date (Optional)</label>
              <input
                type="date"
                className="w-full px-4 py-2.5 rounded-[10px] border border-border focus:border-primary outline-none transition-colors text-sm"
                value={formData.endDate}
                onChange={e => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <div className="flex items-center h-[42px] px-2">
              <input
                type="checkbox"
                id="isActiveJob"
                className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary mr-2"
                checked={formData.isActive}
                onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              />
              <label htmlFor="isActiveJob" className="text-sm font-bold text-heading cursor-pointer">
                Active (Visible on Careers Page)
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-1 pt-4 border-t border-border justify-end">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : 'Save Job'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminJobs;
