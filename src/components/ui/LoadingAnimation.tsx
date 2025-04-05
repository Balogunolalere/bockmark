'use client';

import React from 'react';
import { motion } from 'framer-motion';

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

  const spinTransition = {
    repeat: Infinity,
    ease: "linear",
    duration: 2
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center justify-center ${className}`}
    >
      <div className="relative">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ ...spinTransition, duration: 3 }}
          className={`border-4 border-black ${sizeClasses[size]} bg-yellow-200`}
        />
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ ...spinTransition, duration: 2 }}
          className={`border-4 border-black ${sizeClasses[size]} bg-cyan-200 absolute top-0 left-0 rotate-45`}
        />
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ ...spinTransition, duration: 4 }}
          className={`border-4 border-black ${sizeClasses[size]} bg-lime-200 absolute top-0 left-0 rotate-90`}
        />
      </div>
      {text && (
        <motion.p 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`mt-4 font-bold ${textSizeClasses[size]}`}
        >
          {text}
        </motion.p>
      )}
    </motion.div>
  );
}