import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, MapPin, Building, Clock, ChevronLeft, Calendar } from 'lucide-react';
import MainLayout from '@/shared/layout/MainLayout';
import api from '@/api/client';
import ReactMarkdown from 'react-markdown';

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
}

const JobDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: job, isLoading, isError } = useQuery<Job>({
    queryKey: ['public', 'job', id],
    queryFn: async () => {
      const res = await api.get(`/jobs/${id}`);
      return res.data.job;
    },
    enabled: !!id,
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-surface flex items-center justify-center">
          <p className="text-body">Loading job details...</p>
        </div>
      </MainLayout>
    );
  }

  if (isError || !job) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-surface py-20 px-4 text-center">
          <h1 className="text-3xl font-bold text-heading mb-4">Job Not Found</h1>
          <p className="text-body mb-8">The job you are looking for does not exist or has been closed.</p>
          <Link to="/careers" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark no-underline">
            <ChevronLeft size={16} />
            Back to Careers
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="bg-surface min-h-screen pb-20 pt-[72px]">
        {/* Premium Hero Section */}
        <section className="bg-gradient-to-b from-white to-[oklch(0.98_0.01_80)] border-b border-border py-12 px-4 sm:px-8">
          <div className="max-w-[900px] mx-auto">
            <Link to="/careers" className="inline-flex items-center gap-2 text-primary text-sm font-bold mb-8 hover:opacity-80 transition-opacity no-underline bg-primary-soft/50 px-3 py-1.5 rounded-full w-fit">
              <ChevronLeft size={16} />
              Back to Careers
            </Link>

            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
              <div>
                <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-heading leading-tight mb-4">{job.title}</h1>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-body bg-white px-3.5 py-1.5 rounded-lg border border-border">
                    <Building size={16} className="text-gray-400" /> {job.department}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-body bg-white px-3.5 py-1.5 rounded-lg border border-border">
                    <MapPin size={16} className="text-gray-400" /> {job.location}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm font-bold text-primary bg-primary-soft/30 px-3.5 py-1.5 rounded-lg border border-primary-soft">
                    <Clock size={16} /> {job.type}
                  </span>
                </div>
              </div>
              
              <a
                href={`mailto:info@amjstar.com?subject=Application for ${encodeURIComponent(job.title)}`}
                className="inline-flex items-center justify-center shrink-0 px-8 py-3.5 bg-primary text-white text-[15px] font-bold rounded-xl hover:bg-primary-dark transition-colors no-underline"
              >
                Apply for this job
              </a>
            </div>

            {(job.startDate || job.endDate) && (
              <div className="flex items-center gap-2 text-sm text-body font-medium mt-8 border-t border-border pt-6">
                <Calendar size={18} className="text-primary" />
                {job.startDate && job.endDate ? (
                  <span>Applications open from <strong className="text-heading">{formatDate(job.startDate)}</strong> to <strong className="text-heading">{formatDate(job.endDate)}</strong></span>
                ) : job.startDate ? (
                  <span>Applications opened on <strong className="text-heading">{formatDate(job.startDate)}</strong></span>
                ) : (
                  <span>Applications close on <strong className="text-heading">{formatDate(job.endDate)}</strong></span>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Description Section */}
        <section className="px-4 py-16 sm:px-8">
          <div className="max-w-[800px] mx-auto">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 md:p-12 mb-8">
              <h2 className="text-2xl font-extrabold text-heading mb-8 border-b border-gray-100 pb-4">Job Description</h2>
              <div className="prose prose-slate prose-headings:font-bold prose-h3:text-lg prose-a:text-primary prose-li:text-body max-w-none text-[15px] leading-relaxed text-body">
                <ReactMarkdown>{job.description}</ReactMarkdown>
              </div>
            </div>
            
            {/* Bottom CTA */}
            <div className="bg-cream rounded-2xl border border-border p-8 md:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-primary-soft rounded-full flex items-center justify-center text-primary shrink-0">
                  <Briefcase size={28} />
                </div>
                <div>
                  <h3 className="font-bold text-heading text-xl mb-1">Interested in this role?</h3>
                  <p className="text-[15px] text-body">Send us your resume and tell us why you are a great fit.</p>
                </div>
              </div>
              <a
                href={`mailto:info@amjstar.com?subject=Application for ${encodeURIComponent(job.title)}`}
                className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-3.5 bg-heading text-white text-[15px] font-bold rounded-xl hover:bg-black transition-colors no-underline shrink-0"
              >
                Apply Now
              </a>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default JobDetail;
