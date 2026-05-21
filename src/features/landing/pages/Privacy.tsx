import React from 'react';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '@/shared/layout/MainLayout';
import PageRenderer, { type Section } from '../components/PageRenderer';
import api from '@/api/client';

const Privacy: React.FC = () => {
  const { data, isLoading, isError } = useQuery<{ title: string; sections: Section[] }>({
    queryKey: ['page', 'privacy'],
    queryFn: async () => {
      const res = await api.get('/pages/privacy');
      return res.data.page;
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <MainLayout>
      <div className="bg-surface min-h-screen pt-8">
        {isLoading && (
          <div className="flex items-center justify-center py-32 text-[#94a3b8] text-sm">Loading…</div>
        )}
        {isError && (
          <div className="flex items-center justify-center py-32 text-[#94a3b8] text-sm">Failed to load page.</div>
        )}
        {data && <PageRenderer sections={data.sections} />}
      </div>
    </MainLayout>
  );
};

export default Privacy;
