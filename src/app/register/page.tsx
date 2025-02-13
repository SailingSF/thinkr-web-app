'use client';

import Link from "next/link";
import Image from "next/image";
import { RegisterForm } from "./RegisterForm";
import { useState } from "react";

export default function Register() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white">
      {/* Header */}
      <header className="h-auto md:h-[101px] border-b border-[#2C2D32]">
        <div className="h-full max-w-[1800px] mx-auto px-4 md:px-12 py-4 md:py-0 flex flex-col md:flex-row justify-between items-center relative">
          <div className="flex w-full md:w-auto justify-between items-center">
            <div className="text-[22px] font-tofino tracking-[-0.05em]">
              <Image
                src="/2 Thinkr logo white letter.png"
                alt="Thinkr Logo"
                width={108}
                height={36}
                priority
                className="object-contain w-24 md:w-auto"
              />
            </div>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-white p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
          <nav className={`${isMenuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row w-full md:w-auto items-center gap-4 md:gap-14 mt-4 md:mt-0`}>
            <Link href="/" className="hover:text-gray-300 py-2 md:py-0">Home</Link>
            <Link href="/app" className="hover:text-gray-300 py-2 md:py-0">App</Link>
            <Link href="/faq" className="hover:text-gray-300 py-2 md:py-0">FAQ</Link>
          </nav>
        </div>
      </header>

      {/* Registration Form */}
      <main className="flex flex-col items-center justify-center min-h-[calc(100vh-101px)] px-4 md:px-8">
        <div className="w-full max-w-[917px] space-y-8 md:space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-4xl md:text-[55px] font-normal leading-tight">Create your account.</h2>
            <p className="text-xl md:text-2xl text-[#7C5CFC]">Let's get started.</p>
          </div>

          <RegisterForm />

          <p className="text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="text-[#7C5CFC] hover:text-[#7C5CFC]/80">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
} 