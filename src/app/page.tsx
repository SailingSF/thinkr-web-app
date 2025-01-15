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
        <div className="absolute top-8 left-8">
          <Image
            src="/2 Thinkr logo white letter.png"
            alt="Thinkr Logo"
            width={120}
            height={40}
            priority
            className="object-contain"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <div className="flex justify-end items-center h-16 px-8">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/app" className="text-gray-400 hover:text-white transition-colors">
              App
            </Link>
            <Link href="/faq" className="text-gray-400 hover:text-white transition-colors">
              FAQ
            </Link>
            <Link 
              href="/login"
              className="px-6 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white transition-colors"
            >
              Connect Store
            </Link>
          </div>
        </div>

        {/* Login Form */}
        <div className="flex-1 flex items-center justify-center px-8">
          <Suspense fallback={<div className="text-white">Loading...</div>}>
            <HomeLoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
