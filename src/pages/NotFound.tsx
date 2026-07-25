import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-24 sm:py-32 lg:px-8 relative overflow-hidden bg-surface">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse-scale"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 mix-blend-multiply translate-x-1/3 -translate-y-1/3"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl -z-10 mix-blend-multiply -translate-x-1/3 translate-y-1/3"></div>

      <div className="max-w-max mx-auto text-center relative z-10 animate-slide-up">
        <div className="absolute inset-0 -z-10 flex items-center justify-center opacity-5 select-none pointer-events-none">
          <span className="text-[15rem] md:text-[25rem] font-black text-primary font-display" style={{ lineHeight: 0.8 }}>404</span>
        </div>
        
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 text-primary mb-6 animate-float">
          <Search className="w-8 h-8" />
        </div>

        <p className="text-sm font-bold text-primary uppercase tracking-[0.2em] mb-4">Error 404</p>
        
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-heading sm:text-6xl font-display mb-6">
          Page Not Found
        </h1>
        
        <p className="mt-4 text-lg leading-8 text-body max-w-xl mx-auto mb-10">
          Oops! The page you are looking for on AMJ Star doesn't exist, has been moved, or is temporarily unavailable. Let's get you back on track.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 hover:-translate-y-1 w-full sm:w-auto justify-center"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <span className="absolute inset-0 bg-white/20 translate-y-full transition-transform duration-300 group-hover:translate-y-0"></span>
            <Home className="w-5 h-5 relative z-10" />
            <span className="relative z-10">Return to Home</span>
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-heading shadow-sm ring-1 ring-inset ring-border transition-all duration-300 hover:bg-gray-50 hover:-translate-y-1 w-full sm:w-auto justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
