'use client';

import React from 'react';
import Link from 'next/link';

interface ErrorDisplayProps {
  title?: string;
  message?: string;
  errorCode?: string;
  originalUrl?: string;
  showHomeButton?: boolean;
  className?: string;
}

export default function ErrorDisplay({ 
  title = 'Error',
  message = 'Something went wrong.',
  errorCode,
  originalUrl,
  showHomeButton = true,
  className = ''
}: ErrorDisplayProps) {
  return (
    <div className={`border-4 border-black bg-white p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${className}`}>
      <div className="border-b-4 border-black pb-4 mb-4">
        <h2 className="text-xl sm:text-2xl font-bold">{title}</h2>
      </div>
      
      <div className="py-2">
        <p className="mb-4">{message}</p>
        
        {errorCode && (
          <div className="my-4 p-3 bg-red-100 border-4 border-black">
            <p className="font-bold">Reason: {errorCode}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          {originalUrl && (
            <a
              href={originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-purple-200 border-4 border-black px-4 py-2 text-center font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
            >
              View Original Page →
            </a>
          )}
          
          {showHomeButton && (
            <Link
              href="/"
              className="flex-1 bg-lime-400 border-4 border-black px-4 py-2 text-center font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
            >
              Back to Home
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}