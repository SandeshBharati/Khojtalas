import React from 'react';

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 250 80" 
      className={`h-12 w-auto ${className}`} 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Subtle abstract outline */}
      <path 
        d="M10 50 Q 125 10 240 50" 
        stroke="#ff6b00" 
        fill="none" 
        strokeWidth="2" 
        strokeLinecap="round" 
        opacity="0.5" 
      />
      
      {/* Text */}
      <text 
        x="45" 
        y="55" 
        fontFamily="var(--font-devanagari)" 
        fontSize="32" 
        fill="#ff6b00" 
        fontWeight="bold"
      >
        खोज
      </text>
      <text 
        x="135" 
        y="55" 
        fontFamily="var(--font-sans)" 
        fontSize="32" 
        fill="#0f172a" 
        fontWeight="600"
      >
        Talas
      </text>
    </svg>
  );
}
