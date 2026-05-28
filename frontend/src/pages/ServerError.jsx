import React from 'react';
import { Link } from 'react-router-dom';
import VMLogo from '../components/VMLogo';

export default function ServerError() {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center space-y-8 glass-panel p-8 sm:p-10 rounded-3xl border border-slate-200/50 dark:border-slate-800/30 shadow-premium animate-fade-in relative overflow-hidden">
        
        {/* Background glow ambient effects */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl"></div>

        <div className="space-y-4 relative z-10">
          {/* Circular logo with animation */}
          <div className="flex justify-center mb-6 hover:scale-105 transition-transform duration-300">
            <VMLogo className="h-16 w-16 sm:h-20 sm:w-20 filter drop-shadow-lg" />
          </div>
          
          <h1 className="text-6xl sm:text-7xl font-black bg-gradient-to-r from-rose-500 to-brand-500 bg-clip-text text-transparent tracking-tight">
            500
          </h1>
          
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
            Roadblock Encountered!
          </h2>
          
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
            Our digital engine encountered an unexpected internal server roadblock. Rest assured, our tech riders are already patching it up!
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pt-4 relative z-10">
          <button
            onClick={handleReload}
            className="px-5 py-3 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-darkbg-200 text-slate-700 dark:text-slate-300 font-extrabold text-xs sm:text-sm rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all duration-300"
          >
            Try Refreshing 🔄
          </button>
          
          <Link
            to="/"
            className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs sm:text-sm rounded-full shadow-glass hover:scale-105 active:scale-95 transition-all duration-300"
          >
            <span>Back to Home</span>
            <span>🏠</span>
          </Link>
        </div>
        
      </div>
    </div>
  );
}
