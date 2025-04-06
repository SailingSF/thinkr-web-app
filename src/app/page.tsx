'use client';

import Link from "next/link";
import Image from "next/image";
import { Suspense, useState, lazy } from "react";

// Lazy load non-critical components
const RotatingBackground = lazy(() => import("@/components/RotatingBackground"));
const HomeLoginForm = lazy(() => import("@/components/HomeLoginForm"));

// Loading fallback components
const BackgroundFallback = () => <div className="bg-[#141718] w-full h-full" />;
const FormFallback = () => <div className="text-white p-8 text-center">Loading login form...</div>;

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#141718] flex flex-col">
      {/* Top Navigation Bar */}
      <header className="w-full flex flex-col md:hidden">
        <div className="flex justify-between items-center px-4 py-4">
          <Image
            src="/2 Thinkr logo white letter.png"
            alt="Thinkr Logo"
            width={108}
            height={36}
            priority
            className="object-contain w-24"
          />
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-white p-2"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
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
        <nav className={`${isMenuOpen ? 'flex' : 'hidden'} flex-col items-center gap-4 mt-4 pb-4`}>
          <Link href="/" className="text-white hover:text-gray-200 transition-colors text-[15px] py-2">
            Home
          </Link>
          <Link href="/app" className="text-white hover:text-gray-200 transition-colors text-[15px] py-2">
            App
          </Link>
          <Link href="/faq" className="text-white hover:text-gray-200 transition-colors text-[15px] py-2">
            FAQ
          </Link>
          <Link 
            href="/login"
            className="w-full text-center px-4 py-3 bg-[#8c74ff] hover:bg-[#7c64ef] rounded-[10px] text-white transition-colors font-bold text-[15px]"
          >
            Connect Store
          </Link>
        </nav>
      </header>

      {/* Desktop Layout */}
      <div className="hidden md:flex flex-1 flex-row">
        {/* Left side - Rotating Image */}
        <div className="w-1/2 relative">
          <Suspense fallback={<BackgroundFallback />}>
            <RotatingBackground />
          </Suspense>
          {/* Logo overlay */}
          <div className="absolute top-7 left-12">
            <Image
              src="/2 Thinkr logo white letter.png"
              alt="Thinkr Logo"
              width={108}
              height={36}
              priority
              className="object-contain"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex-1 flex flex-col">
          {/* Top Navigation */}
          <div className="w-full flex justify-end items-center h-14 px-8 pt-6">
            <div className="flex items-center gap-7">
              <Link href="/" className="text-white hover:text-gray-200 transition-colors text-[15px]">
                Home
              </Link>
              <Link href="/app" className="text-white hover:text-gray-200 transition-colors text-[15px]">
                App
              </Link>
              <Link href="/faq" className="text-white hover:text-gray-200 transition-colors text-[15px]">
                FAQ
              </Link>
              <Link 
                href="/login"
                className="px-4 py-3 bg-[#8c74ff] hover:bg-[#7c64ef] rounded-[10px] text-white transition-colors font-bold text-[15px]"
              >
                Connect Store
              </Link>
            </div>
          </div>

          {/* Login Form Container */}
          <div className="flex-1 flex justify-center items-center">
            <Suspense fallback={<FormFallback />}>
              <HomeLoginForm />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Mobile Layout Content */}
      <div className="flex flex-col md:hidden flex-1">
        {/* Login Form Container */}
        <div className="flex-1 flex justify-center items-center px-4 py-8">
          <Suspense fallback={<FormFallback />}>
            <HomeLoginForm />
          </Suspense>
        </div>

        {/* Bottom Image */}
        <div className="relative h-[calc(100vh-80vh)]">
          <Suspense fallback={<BackgroundFallback />}>
            <RotatingBackground />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
