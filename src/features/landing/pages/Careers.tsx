import React from 'react';
import MainLayout from '@/shared/layout/MainLayout';
import { Link } from 'react-router-dom';
import { Briefcase, Users, Rocket, Target, Mail, MapPin, Building, Clock, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/client';

interface Job {
  _id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  isActive: boolean;
}

const Careers: React.FC = () => {
  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ['public', 'jobs'],
    queryFn: async () => {
      const res = await api.get('/jobs');
      return res.data.jobs;
    },
  });

  return (
    <MainLayout>
      <div className="bg-surface min-h-screen">
        {/* Header */}
        <section className="bg-gradient-to-br from-white to-[oklch(0.97_0.02_75)] pt-24 pb-14 border-b border-border">
          <div className="max-w-[var(--width-container)] mx-auto px-4 sm:px-8 text-center">
            <span className="inline-block px-4 py-1.5 bg-primary-soft text-primary rounded-full text-sm font-bold mb-4">
              Join Our Team
            </span>
            <h1 className="text-[clamp(2.5rem,5vw,3.5rem)] font-extrabold text-heading leading-tight mb-4">
              Careers at AMJSTAR
            </h1>
            <p className="text-body text-base max-w-2xl mx-auto leading-relaxed">
              We are on a mission to restructure India's B2B ecosystem. Join us and be a part of the journey to empower millions of businesses.
            </p>
          </div>
        </section>

        {/* Culture / Values */}
        <section className="py-16 px-4 sm:px-8 max-w-[var(--width-container)] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-heading mb-4">Why Work With Us?</h2>
            <p className="text-body text-base max-w-xl mx-auto">
              At AMJSTAR, we value innovation, transparency, and a growth mindset. Here’s what makes us different.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Rocket size={24} />, title: 'High Impact', desc: 'Build products that directly empower small businesses across India.' },
              { icon: <Users size={24} />, title: 'Great Culture', desc: 'Work with a passionate, transparent, and collaborative team.' },
              { icon: <Target size={24} />, title: 'Growth First', desc: 'We invest in your learning and career development.' },
              { icon: <Briefcase size={24} />, title: 'Ownership', desc: 'Take charge of your work and see your ideas come to life.' },
            ].map((feature, i) => (
              <div key={i} className="bg-white p-6 rounded-[14px] border border-border hover:shadow-sm transition-shadow text-center">
                <div className="w-12 h-12 rounded-full bg-primary-soft text-primary flex items-center justify-center mx-auto mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-bold text-heading text-lg mb-2">{feature.title}</h3>
                <p className="text-body text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Current Openings */}
        <section className="bg-cream py-16 px-4 sm:px-8 border-t border-border">
          <div className="max-w-[var(--width-container)] mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-10 gap-4 text-center md:text-left">
              <div>
                <h2 className="text-3xl font-extrabold text-heading mb-2">Open Positions</h2>
                <p className="text-body text-base">Explore our current job openings.</p>
              </div>
              <a href="mailto:info@amjstar.com?subject=Spontaneous%20Application" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-[8px] hover:bg-primary-dark transition-colors no-underline">
                <Mail size={18} />
                Send Spontaneous Application
              </a>
            </div>

            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center text-body">
                <p className="text-sm">Loading positions...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="bg-white rounded-[16px] border border-border overflow-hidden">
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="text-gray-400" size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-heading mb-2">No open positions right now</h3>
                  <p className="text-body max-w-md mx-auto">
                    We are not actively hiring for any specific roles at the moment, but we are always on the lookout for great talent. Send us your resume at <strong>info@amjstar.com</strong> and we'll keep you in mind for future roles!
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {jobs.map((job) => (
                  <div key={job._id} className="relative bg-white rounded-xl border border-gray-200 p-6 hover:border-primary hover:shadow-md transition-all group flex flex-col h-full overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary-soft opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="mb-4">
                      <h3 className="text-[19px] font-bold text-heading mb-3 group-hover:text-primary transition-colors line-clamp-2 leading-tight">{job.title}</h3>

                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className="flex items-center gap-1.5 text-[11px] font-medium text-body bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                          <Building size={12} /> {job.department}
                        </span>
                        <span className="flex items-center gap-1.5 text-[11px] font-medium text-body bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                          <MapPin size={12} /> {job.location}
                        </span>
                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-primary bg-primary-soft/50 px-2.5 py-1 rounded-md border border-primary-soft">
                          <Clock size={12} /> {job.type}
                        </span>
                      </div>
                      
                      <p className="text-sm text-body/80 line-clamp-2 leading-relaxed">
                        {job.description.replace(/[#*`_>-]/g, '').trim()}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-5 border-t border-gray-100">
                      <Link
                        to={`/careers/${job._id}`}
                        className="inline-flex items-center justify-center px-4 py-2 bg-gray-50 text-gray-700 text-[13px] font-bold rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-primary transition-all no-underline"
                      >
                        View Details
                      </Link>
                      <a
                        href={`mailto:info@amjstar.com?subject=Application for ${encodeURIComponent(job.title)}`}
                        className="inline-flex items-center justify-center px-5 py-2 bg-primary text-white text-[13px] font-bold rounded-lg hover:bg-primary-dark transition-all shadow-sm hover:shadow-md no-underline"
                      >
                        Apply
                        <ChevronRight size={14} className="ml-1" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default Careers;
