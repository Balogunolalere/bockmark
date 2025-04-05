'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

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
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`border-4 border-black bg-white p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${className}`}
    >
      <motion.div 
        variants={itemVariants}
        className="border-b-4 border-black pb-4 mb-4"
      >
        <motion.h2 
          className="text-xl sm:text-2xl font-bold"
          variants={itemVariants}
        >
          {title}
        </motion.h2>
      </motion.div>
      
      <motion.div 
        variants={itemVariants}
        className="py-2"
      >
        <motion.p 
          variants={itemVariants}
          className="mb-4"
        >
          {message}
        </motion.p>
        
        {errorCode && (
          <motion.div 
            variants={itemVariants}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="my-4 p-3 bg-red-100 border-4 border-black"
          >
            <motion.p 
              variants={itemVariants}
              className="font-bold"
            >
              Reason: {errorCode}
            </motion.p>
          </motion.div>
        )}

        <motion.div 
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 mt-6"
        >
          {originalUrl && (
            <motion.a
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href={originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-purple-200 border-4 border-black px-4 py-2 text-center font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
            >
              View Original Page →
            </motion.a>
          )}
          
          {showHomeButton && (
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href="/"
                className="flex-1 bg-lime-400 border-4 border-black px-4 py-2 text-center font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none block"
              >
                Back to Home
              </Link>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}