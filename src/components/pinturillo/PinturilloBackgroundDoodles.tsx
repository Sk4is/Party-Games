import React from 'react';

export const PinturilloBackgroundDoodles: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Hand-drawn SVG doodle assets with slow subtle floating animations */}
      <svg
        className="absolute top-8 left-8 w-16 h-16 text-amber-400/20 animate-pulse"
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Star */}
        <polygon points="50,5 64,36 98,38 72,60 80,95 50,75 20,95 28,60 2,38 36,36" />
      </svg>

      <svg
        className="absolute top-1/4 left-12 w-20 h-20 text-rose-400/20"
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Heart */}
        <path d="M50,85 C20,60 5,40 5,25 C5,10 20,5 35,5 C43,5 48,12 50,16 C52,12 57,5 65,5 C80,5 95,10 95,25 C95,40 80,60 50,85 Z" />
      </svg>

      <svg
        className="absolute bottom-16 left-20 w-24 h-16 text-cyan-400/20"
        viewBox="0 0 120 80"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      >
        {/* Cloud */}
        <path d="M20,60 Q5,60 5,45 Q5,30 20,30 Q25,10 45,10 Q65,10 70,25 Q85,15 95,30 Q110,35 110,50 Q110,60 95,60 Z" />
      </svg>

      <svg
        className="absolute top-12 right-16 w-16 h-20 text-yellow-300/20"
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Lightning bolt */}
        <polyline points="60,5 25,50 50,50 40,95 75,45 52,45 60,5" />
      </svg>

      <svg
        className="absolute top-1/3 right-10 w-20 h-20 text-emerald-400/20"
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      >
        {/* Planet with ring */}
        <circle cx="50" cy="50" r="24" />
        <ellipse cx="50" cy="50" rx="42" ry="14" transform="rotate(-20 50 50)" />
      </svg>

      <svg
        className="absolute bottom-20 right-24 w-18 h-18 text-purple-400/20"
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      >
        {/* Spiral / scribble */}
        <path d="M50,50 A5,5 0 0,0 45,45 A10,10 0 0,0 40,55 A15,15 0 0,0 60,60 A20,20 0 0,0 65,35 A25,25 0 0,0 30,30 A30,30 0 0,0 25,75 A35,35 0 0,0 80,75" />
      </svg>

      <svg
        className="absolute top-2/3 left-1/2 -translate-x-1/2 w-28 h-12 text-slate-500/15"
        viewBox="0 0 200 60"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      >
        {/* Wavy hand drawn underline */}
        <path d="M10,30 Q35,10 60,30 T110,30 T160,30 T190,30" />
      </svg>
    </div>
  );
};
