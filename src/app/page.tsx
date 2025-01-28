'use client';

import Link from "next/link";
import Image from "next/image";
import RotatingBackground from "@/components/RotatingBackground";
import HomeLoginForm from "@/components/HomeLoginForm";
import { Suspense, useState } from "react";

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#1a1b1e] flex flex-col md:flex-row">
      {/* Left side - Rotating Image */}
      <div className="w-full md:w-1/2 h-48 md:h-auto relative md:block">
        <RotatingBackground />
        {/* Logo overlay */}
        <div className="absolute top-4 md:top-7 left-4 md:left-12">
          <Image
            src="/2 Thinkr logo white letter.png"
            alt="Thinkr Logo"
            width={108}
            height={36}
            priority
            className="object-contain w-24 md:w-auto"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <div className="w-full flex flex-col md:flex-row md:justify-end items-start md:items-center h-auto md:h-14 px-4 md:px-8 pt-4 md:pt-6 relative">
          {/* Mobile menu button */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden absolute top-4 right-4 text-white p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Navigation links */}
          <div className={`${isMenuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row w-full md:w-auto items-center gap-4 md:gap-7 mt-12 md:mt-0`}>
            <Link href="/" className="text-white hover:text-gray-200 transition-colors text-[15px] py-2 md:py-0">
              Home
            </Link>
            <Link href="/app" className="text-white hover:text-gray-200 transition-colors text-[15px] py-2 md:py-0">
              App
            </Link>
            <Link href="/faq" className="text-white hover:text-gray-200 transition-colors text-[15px] py-2 md:py-0">
              FAQ
            </Link>
            <Link 
              href="/login"
              className="w-full md:w-auto text-center px-4 py-3 bg-[#8c74ff] hover:bg-[#7c64ef] rounded-[10px] text-white transition-colors font-bold text-[15px]"
            >
              Connect Store
            </Link>
          </div>
        </div>

        {/* Login Form Container */}
        <div className="flex-1 flex justify-center items-center px-4 md:px-0 py-8 md:py-0">
          <Suspense fallback={<div className="text-white">Loading...</div>}>
            <HomeLoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
