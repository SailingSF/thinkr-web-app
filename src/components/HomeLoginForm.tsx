'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function HomeLoginForm() {
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect');
  const reason = searchParams.get('reason');
  const { login, isLoading, error: loginError } = useAuth(redirectPath);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const email = formData.get('email')?.toString() || '';
    const password = formData.get('password')?.toString() || '';

    await login(email, password);
  };

  return (
    <div className="w-[385px] max-w-full flex flex-col items-start justify-start gap-[45px] leading-[normal] tracking-[normal]">
      <section className="flex flex-col items-start justify-start py-0 pl-0 pr-5 box-border gap-2 max-w-full text-left">
        <h1 className="relative text-[47.5px] text-white">Welcome back.</h1>
        <p className="self-stretch relative text-[21.5px] text-[#8c74ff]">
          Sign in to your account.
        </p>
      </section>

      <form onSubmit={handleSubmit} className="self-stretch flex flex-col items-start justify-start gap-[6px] max-w-full">
        {(loginError || reason === 'session_expired') && (
          <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-md mb-4">
            {reason === 'session_expired' 
              ? 'Your session has expired. Please log in again.'
              : loginError
            }
          </div>
        )}

        <label className="self-stretch relative text-[13px] text-white">Email address</label>
        <div className="self-stretch rounded-[4px] bg-[#282c2d] flex flex-row items-start justify-start pt-[13px] px-[21px] pb-[15px] box-border max-w-full">
          <input 
            type="email"
            id="email"
            name="email"
            autoComplete="email"
            required
            placeholder="example@thinkr.com"
            className="bg-transparent w-full outline-none text-white placeholder:text-[#475569] text-[13.5px]"
          />
        </div>

        <label className="self-stretch relative text-[13px] text-white">Password</label>
        <div className="self-stretch rounded-[4px] bg-[#282c2d] flex flex-row items-start justify-start pt-[13px] px-[21px] pb-[15px] box-border max-w-full">
          <input 
            type="password"
            id="password"
            name="password"
            autoComplete="current-password"
            required
            placeholder="Enter your password"
            className="bg-transparent w-full outline-none text-white placeholder:text-[#475569] text-[13.5px]"
          />
        </div>

        <div className="self-stretch flex flex-row items-start justify-end text-right">
          <Link href="/forgot-password" className="w-[125px] relative inline-block text-[#86888a] text-[13px]">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`cursor-pointer border-none py-[11px] px-[169px] bg-[#8c74ff] rounded-[4px] flex flex-row items-center justify-center gap-2 box-border max-w-full hover:bg-[#7c64ef] w-full ${
            isLoading ? 'opacity-90 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="relative text-[13.5px] text-white text-left inline-block whitespace-nowrap">
                Signing in...
              </span>
            </>
          ) : (
            <span className="relative text-[13.5px] text-white text-left inline-block">
              Sign in
            </span>
          )}
        </button>

        <p className="w-[333px] relative text-[#86888a] text-[13px] inline-block max-w-full">
          Don't have an account?
        </p>

        <Link
          href="/register"
          className="cursor-pointer border-none py-[11px] px-[166px] bg-[#ba90ff] rounded-[4px] flex flex-row items-start justify-center box-border max-w-full hover:bg-[#aa80ef] w-full no-underline"
        >
          <span className="relative text-[13.5px] text-white text-left inline-block min-w-[51px] z-[1]">
            Sign up
          </span>
        </Link>
      </form>
    </div>
  );
} 