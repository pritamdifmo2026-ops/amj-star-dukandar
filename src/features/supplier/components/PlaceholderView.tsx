import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface PlaceholderViewProps {
  title: string;
  icon: LucideIcon;
  description: string;
}

const PlaceholderView: React.FC<PlaceholderViewProps> = ({ title, icon: Icon, description }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center text-[#64748b]">
      <div className="w-24 h-24 bg-[#f1f5f9] text-[#94a3b8] rounded-full flex items-center justify-center mb-6">
        <Icon size={64} />
      </div>
      <h2 className="text-xl font-bold text-[#1e293b] mb-3">{title}</h2>
      <p className="text-[0.95rem] max-w-[400px] leading-relaxed">{description}</p>
      <div className="mt-6 px-4 py-1.5 bg-[#f1f5f9] text-[#64748b] text-xs font-bold uppercase rounded-full tracking-wider">Coming Soon</div>
    </div>
  );
};

export default PlaceholderView;
