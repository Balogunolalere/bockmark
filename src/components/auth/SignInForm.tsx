'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingAnimation from '@/components/ui/LoadingAnimation';

export default function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setErrorMessage(result.error);
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setErrorMessage('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <motion.form 
      onSubmit={handleSubmit} 
      variants={formVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 bg-white p-4 sm:p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
    >
      <motion.div 
        variants={itemVariants}
        className="space-y-2"
      >
        <label 
          htmlFor="email" 
          className="block text-base font-bold"
        >
          Email
        </label>
        <motion.input
          whileFocus={{ scale: 1.01 }}
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border-4 border-black bg-yellow-50 px-3 sm:px-4 py-2 sm:py-3 text-base font-medium placeholder:text-gray-500 focus:outline-none"
          placeholder="name@example.com"
          required
        />
      </motion.div>
      
      <motion.div 
        variants={itemVariants}
        className="space-y-2"
      >
        <label 
          htmlFor="password"
          className="block text-base font-bold"
        >
          Password
        </label>
        <motion.input
          whileFocus={{ scale: 1.01 }}
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border-4 border-black bg-yellow-50 px-3 sm:px-4 py-2 sm:py-3 text-base font-medium placeholder:text-gray-500 focus:outline-none"
          required
        />
      </motion.div>

      <AnimatePresence mode="wait">
        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-100 border-4 border-black p-3 sm:p-4 text-sm font-bold text-red-700"
          >
            {errorMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        variants={itemVariants}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-cyan-400 border-4 border-black px-6 sm:px-8 py-2 sm:py-3 text-base sm:text-lg font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <div className="flex items-center justify-center">
            <LoadingAnimation size="md" text="Signing in..." />
          </div>
        ) : (
          "Sign In"
        )}
      </motion.button>

      <motion.div 
        variants={itemVariants}
        className="text-center"
      >
        <span className="text-sm sm:text-base">Don&apos;t have an account? </span>
        <motion.a 
          href="/auth/signup" 
          className="font-bold underline decoration-4 hover:bg-yellow-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Sign up
        </motion.a>
      </motion.div>
    </motion.form>
  );
}