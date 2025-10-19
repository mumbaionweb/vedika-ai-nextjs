import React from 'react';

interface VaiLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export default function VaiLogo({ className = '', width = 120, height = 40 }: VaiLogoProps) {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 120 40" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#FFD700', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#DAA520', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#B8860B', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      
      {/* Main V */}
      <text 
        x="10" 
        y="28" 
        fontFamily="Inter, sans-serif"
        fontWeight="800" 
        fontSize="24" 
        fill="url(#goldGradient)"
        dominantBaseline="middle"
      >
        V
      </text>

      {/* .ai */}
      <text 
        x="40" 
        y="28" 
        fontFamily="Inter, sans-serif"
        fontWeight="600" 
        fontSize="16" 
        fill="url(#goldGradient)"
        dominantBaseline="middle"
      >
        .ai
      </text>
    </svg>
  );
}
