import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/auth.slice';

interface Step { n: number; label: string; desc: string; }
interface ResellerOnboardingLayoutProps { children: React.ReactNode; currentStep: number; steps: Step[]; }

const ResellerOnboardingLayout: React.FC<ResellerOnboardingLayoutProps> = ({ children, currentStep, steps }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = () => { dispatch(logout()); navigate('/'); };

  return (
    <div className="h-screen overflow-hidden flex bg-white max-md:flex-col max-md:h-auto">
      <aside className="w-[300px] bg-[#0f172a] text-white px-7 py-10 flex flex-col justify-between max-md:w-full max-md:py-6">
        <div className="flex flex-col gap-10">
          <Link to="/" className="flex items-center gap-2.5 text-white no-underline font-bold text-lg">
            <img src="/favicon.jpeg" alt="AMJStar Logo" className="w-7 h-7 rounded-[4px]" />
            AMJStar
          </Link>

          <div className="relative before:content-[''] before:absolute before:top-[15px] before:bottom-[15px] before:left-[15px] before:w-[2px] before:border-l-2 before:border-dashed before:border-[#334155] max-md:before:hidden flex flex-col gap-5">
            {steps.map(step => {
              const isActive = currentStep === step.n;
              const isCompleted = currentStep > step.n;
              return (
                <div key={step.n} className="flex items-center gap-3 relative z-[1]">
                  <div className={`w-[30px] h-[30px] rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all ${isCompleted ? 'bg-[#10b981] text-white' : isActive ? 'bg-primary text-white' : 'bg-[#1e293b] text-[#94a3b8]'}`}>
                    {isCompleted ? <Check size={16} /> : step.n}
                  </div>
                  <div>
                    <div className={`text-sm font-bold ${isActive ? 'text-white' : isCompleted ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>{step.label}</div>
                    <div className="text-xs text-[#475569]">{step.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button className="text-sm text-[#64748b] font-semibold bg-none border-none cursor-pointer text-left hover:text-white transition-colors" onClick={handleLogout}>
          Sign Out
        </button>
      </aside>

      <main className="flex-1 overflow-y-auto" id="reseller-form-scroll-area">
        <div className="max-w-[680px] mx-auto py-12 px-8 max-md:px-4 max-md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default ResellerOnboardingLayout;
