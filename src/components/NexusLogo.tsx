import React from 'react';

export default function NexusLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-white rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.3)] overflow-hidden p-1 ${className}`}>
      <img 
        src="https://i.postimg.cc/vZq064FL/Chat-GPT-Image-14-de-mar-de-2026-10-15-19-removebg-preview.png" 
        alt="Papos Logo" 
        className="w-full h-full object-contain"
      />
    </div>
  );
}
