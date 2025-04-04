'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-4 sm:p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <div className="space-y-2">
        <label 
          htmlFor="email" 
          className="block text-base font-bold"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border-4 border-black bg-yellow-50 px-3 sm:px-4 py-2 sm:py-3 text-base font-medium placeholder:text-gray-500 focus:outline-none"
          placeholder="name@example.com"
          required
        />
      </div>
      
      <div className="space-y-2">
        <label 
          htmlFor="password"
          className="block text-base font-bold"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border-4 border-black bg-yellow-50 px-3 sm:px-4 py-2 sm:py-3 text-base font-medium placeholder:text-gray-500 focus:outline-none"
          required
        />
      </div>

      {errorMessage && (
        <div className="bg-red-100 border-4 border-black p-3 sm:p-4 text-sm font-bold text-red-700">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        className="w-full bg-cyan-400 border-4 border-black px-6 sm:px-8 py-2 sm:py-3 text-base sm:text-lg font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
      >
        Sign In
      </button>

      <div className="text-center">
        <span className="text-sm sm:text-base">Don&apos;t have an account? </span>
        <a href="/auth/signup" className="font-bold underline decoration-4 hover:bg-yellow-200">
          Sign up
        </a>
      </div>
    </form>
  );
}