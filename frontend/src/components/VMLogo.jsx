import React from 'react';
import logoImg from '../assets/logo.png';

export default function VMLogo({ className = "h-8 w-8", glow = true }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {glow && (
        <div className="absolute inset-0 bg-brand-500/20 rounded-full blur-md scale-95 animate-pulse"></div>
      )}
      <img
        src={logoImg}
        alt="Vadakara Mart Logo"
        className="w-full h-full object-contain relative z-10 rounded-full bg-white shadow-sm"
      />
    </div>
  );
}
