import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export default function AppSidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const navigationItems = [
    {
      name: 'Action Hub',
      href: '/app',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      isActive: pathname === '/app',
    },
    {
      name: 'Chat',
      href: '/app/chat',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      isActive: pathname === '/app/chat',
    },
    {
      name: 'Scheduler',
      href: '/app/scheduler',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      isActive: pathname === '/app/scheduler',
    },
    {
      name: 'Deep Research',
      href: '/app/deep_research',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      isActive: pathname === '/app/deep_research'
    },
    {
      name: 'Integrations',
      href: '/app/integrations',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      ),
      isActive: pathname === '/app/integrations',
    },
    {
      name: 'Autopilot',
      href: '/app/autopilot',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4L12 2M8 8h8a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2v-6a2 2 0 012-2zM10 11h.01M14 11h.01" />
          <circle cx="10" cy="11" r="1" className="text-current" fill="currentColor" />
          <circle cx="14" cy="11" r="1" className="text-current" fill="currentColor" />
        </svg>
      ),
      isActive: pathname === '/app/autopilot',
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="px-3 py-5">
        {!imageError ? (
          <Image
            src="/thinkr-logo-white.png"
            alt="Thinkr Logo"
            width={240}
            height={80}
            priority
            className="w-auto h-[60px]"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="text-white text-2xl font-bold">THINKR</div>
        )}
      </div>
      
      <nav className="flex-1 px-2">
        <div className="space-y-1">
          {navigationItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-normal transition-colors ${
                item.isActive
                  ? 'bg-[#7B6EF6] text-white'
                  : 'text-gray-300 hover:bg-[#232627] hover:text-white'
              }`}
            >
              <span>{item.name}</span>
              <div className="w-4 h-4 opacity-60">
                {item.icon}
              </div>
            </Link>
          ))}
        </div>
      </nav>

      <div className="px-2 pb-3 mt-auto">
        <Link
          href="/app/profile"
          className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-normal transition-colors ${
            pathname === '/app/profile'
              ? 'bg-[#7B6EF6] text-white'
              : 'text-gray-300 hover:bg-[#232627] hover:text-white'
          }`}
        >
          <span>Profile</span>
          <div className="w-4 h-4 opacity-60">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </Link>
      </div>
    </div>
  );

  if (!isMounted) {
    return null;
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed top-0 left-0 h-screen p-3 z-20">
        <div className="h-full w-[256px]">
          <div className="w-full h-full bg-[#1E1F20] rounded-[8px] shadow-lg">
            {sidebarContent}
          </div>
        </div>
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-4 right-4 z-50 p-2 rounded-lg bg-[#232627] lg:hidden"
      >
        <svg
          className="w-5 h-5 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isMobileMenuOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-0 z-40 lg:hidden ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        } transition-opacity duration-300`}
      >
        <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
        <div
          className={`absolute left-0 top-0 h-full w-[256px] bg-[#1E1F20] transform transition-transform duration-300 ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {sidebarContent}
        </div>
      </div>
    </>
  );
} 