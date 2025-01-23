import Link from "next/link";
import Image from "next/image";
import RotatingBackground from "@/components/RotatingBackground";
import HomeLoginForm from "@/components/HomeLoginForm";
import { Suspense } from "react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#1a1b1e] flex flex-col md:flex-row">
      {/* Left side - Rotating Image */}
      <div className="w-1/2 relative hidden md:block">
        <RotatingBackground />
        {/* Logo overlay */}
        <div className="absolute top-7 left-12">
          <Image
            src="/2 thinkr logo white letter.png"
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
          <Suspense fallback={<div className="text-white">Loading...</div>}>
            <HomeLoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
