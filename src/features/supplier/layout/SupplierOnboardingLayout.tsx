import React from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import logo from '@/assets/logoo.png';

interface Step {
  n: number;
  label: string;
  desc: string;
}

interface SupplierOnboardingLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  steps: Step[];
}

const SupplierOnboardingLayout: React.FC<SupplierOnboardingLayoutProps> = ({ children, currentStep, steps }) => {
  return (
    <div className="h-screen overflow-hidden flex bg-white max-md:flex-col max-md:h-auto max-md:overflow-visible">
      {/* Sidebar */}
      <div className="w-[320px] bg-[#0f172a] text-white px-[30px] py-10 flex flex-col max-md:w-full max-md:px-5 max-md:py-5">
        <div className="flex flex-col">
          <Link
            to="/"
            className="flex items-center gap-3 pb-3 mb-10 relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-10 after:h-[3px] after:bg-primary max-md:mb-5 no-underline"
          >
            <div className="w-[45px] h-[45px] rounded-full flex items-center justify-center p-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.15)] bg-transparent">
              <img src={logo} alt="AMJSTAR Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-[1.3rem] font-extrabold text-white tracking-tight">AMJSTAR</span>
          </Link>

          <div className="flex flex-col gap-[60px] relative before:content-[''] before:absolute before:top-[15px] before:bottom-[15px] before:left-[15px] before:w-[2px] before:border-l-2 before:border-dashed before:border-[#334155] before:z-0 max-md:flex-row max-md:overflow-x-auto max-md:gap-3 max-md:pb-2 max-md:before:hidden">
            {steps.map(step => {
              const isActive = currentStep === step.n;
              const isCompleted = currentStep > step.n;
              return (
                <div key={step.n} className="flex items-start gap-4 relative z-[1]">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[0.8rem] font-bold transition-all shrink-0 border-2 ${
                    isCompleted ? 'bg-[#10b981] border-[#10b981] text-white' :
                    isActive ? 'bg-primary border-primary text-white' :
                    'bg-[#1e293b] border-[#334155] text-[#94a3b8]'
                  }`}>
                    {isCompleted ? <Check size={16} /> : step.n}
                  </div>
                  <div className="flex flex-col pt-1 max-md:hidden">
                    <span className={`text-[0.95rem] font-semibold ${isActive || isCompleted ? 'text-white' : 'text-[#94a3b8]'}`}>{step.label}</span>
                    <span className="text-[0.8rem] text-[#64748b] mt-1">{step.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 flex bg-white">
        <div
          id="supplier-form-scroll-area"
          className="flex-[2] px-[60px] py-[60px] overflow-y-auto flex flex-col justify-start scrollbar-none max-md:w-full max-md:px-5 max-md:py-6 max-md:flex-none max-md:h-auto"
        >
          {children}
        </div>
        <div className="flex-[0_0_42%] bg-[#e2e8f0] hidden lg:block">
          <img
            src="https://media.istockphoto.com/id/1197932646/photo/congratulating-the-new-partners.jpg?s=612x612&w=0&k=20&c=t1hbDdPtSEEfkznvCKSJVfg1rBb-EdUqG4C8CTLmmVo="
            alt="Business Partners"
            className="w-full h-full object-cover"
          />
        </div>
      </main>
    </div>
  );
};

export default SupplierOnboardingLayout;
