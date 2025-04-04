'use client';

import React from 'react';

interface LoadingAnimationProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export default function LoadingAnimation({ 
  size = 'md',
  text = 'Loading...',
  className = ''
}: LoadingAnimationProps) {
  
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-14 h-14'
  };

  const textSizeClasses = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl'
  };
  
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative">
        <div className={`border-4 border-black ${sizeClasses[size]} bg-yellow-200 animate-[spin_3s_linear_infinite]`}></div>
        <div className={`border-4 border-black ${sizeClasses[size]} bg-cyan-200 absolute top-0 left-0 rotate-45 animate-[spin_2s_linear_infinite]`}></div>
        <div className={`border-4 border-black ${sizeClasses[size]} bg-lime-200 absolute top-0 left-0 rotate-90 animate-[spin_4s_linear_infinite]`}></div>
      </div>
      {text && (
        <p className={`mt-4 font-bold ${textSizeClasses[size]}`}>{text}</p>
      )}
    </div>
  );
}