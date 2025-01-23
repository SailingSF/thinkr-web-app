import Link from "next/link";
import Image from "next/image";
import RotatingBackground from "@/components/RotatingBackground";
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
        <div className="w-full flex justify-end items-center h-16 px-8 pt-6">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-white hover:text-gray-200 transition-colors text-[16.5px]">
              Home
            </Link>
            <Link href="/app" className="text-white hover:text-gray-200 transition-colors text-[16.5px]">
              App
            </Link>
            <Link href="/faq" className="text-white hover:text-gray-200 transition-colors text-[16.5px]">
              FAQ
            </Link>
            <Link 
              href="/login"
              className="px-4 py-3.5 bg-[#8c74ff] hover:bg-[#7c64ef] rounded-[11px] text-white transition-colors font-bold text-[16.5px]"
            >
              Connect Store
            </Link>
          </div>
        </div>

        {/* Login Form Container */}
        <div className="flex-1 flex justify-center items-center">
          {/* Login Form Content */}
          <div className="w-[449px] max-w-full flex flex-col items-start justify-start gap-[52px] leading-[normal] tracking-[normal]">
            <section className="flex flex-col items-start justify-start py-0 pl-0 pr-5 box-border gap-2 max-w-full text-left">
              <h1 className="relative text-[55.2px] text-white">Welcome back.</h1>
              <p className="self-stretch relative text-[25px] text-[#8c74ff]">
                Sign in to your account.
              </p>
            </section>

            <section className="self-stretch flex flex-col items-start justify-start gap-[7.1px] max-w-full">
              <label className="self-stretch relative text-sm-2 text-white">Email address</label>
              <div className="self-stretch rounded-[5px] bg-[#282c2d] flex flex-row items-start justify-start pt-[15px] px-[25px] pb-[18px] box-border max-w-full">
                <input 
                  type="email" 
                  placeholder="example@thinkr.com"
                  className="bg-transparent w-full outline-none text-white placeholder:text-[#475569] text-base-5"
                />
              </div>

              <label className="self-stretch relative text-sm-2 text-white">Password</label>
              <div className="self-stretch rounded-[5px] bg-[#282c2d] flex flex-row items-start justify-start pt-[15px] px-[25px] pb-[18px] box-border max-w-full">
                <input 
                  type="password"
                  placeholder="Enter your password"
                  className="bg-transparent w-full outline-none text-white placeholder:text-[#475569] text-base-5"
                />
              </div>

              <div className="self-stretch flex flex-row items-start justify-end text-right">
                <Link href="/forgot-password" className="w-[146px] relative inline-block text-[#86888a] text-sm-2">
                  Forgot password?
                </Link>
              </div>

              <button className="cursor-pointer border-none py-3.5 px-[198px] bg-[#8c74ff] rounded-[5px] flex flex-row items-start justify-center box-border max-w-full hover:bg-[#7c64ef] w-full">
                <span className="relative text-base-5 text-white text-left inline-block min-w-[54px] z-[1]">
                  Sign in
                </span>
              </button>

              <p className="w-[389px] relative text-[#86888a] text-sm-2 inline-block max-w-full">
                Don't have an account?
              </p>

              <button className="cursor-pointer border-none py-3.5 px-[194px] bg-[#ba90ff] rounded-[5px] flex flex-row items-start justify-center box-border max-w-full hover:bg-[#aa80ef] w-full">
                <span className="relative text-base-5 text-white text-left inline-block min-w-[60px] z-[1]">
                  Sign up
                </span>
              </button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
