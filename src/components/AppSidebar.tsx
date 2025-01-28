import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export default function AppSidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

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
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      isActive: pathname === '/app',
    },
    {
      name: 'Scheduler',
      href: '/app/scheduler',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      isActive: pathname === '/app/scheduler',
    },
    {
      name: 'Integrations',
      href: '/app/integrations',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
        </svg>
      ),
      isActive: pathname === '/app/integrations',
    },
    {
      name: 'Autopilot',
      href: '/app/autopilot',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      isActive: pathname === '/app/autopilot',
    },
  ];

  const comingSoonItems = [
    {
      name: 'Chat',
      href: '#',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      comingSoon: true,
    },
    {
      name: 'Calendar',
      href: '#',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      comingSoon: true,
    },
  ];

  const sidebarContent = (
    <>
      {/* Navigation Links */}
      <nav className="flex-1 px-5 pt-5">
        <div className="space-y-3">
          {navigationItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-5 py-4 rounded-xl text-[16px] font-medium transition-colors ${
                item.isActive
                  ? 'bg-[#7B6EF6] text-white'
                  : 'text-gray-300 hover:bg-[#2c2f30] hover:text-white'
              }`}
            >
              <span>{item.name}</span>
              <div className="w-6 h-6">
                {item.icon}
              </div>
            </Link>
          ))}
        </div>

        <div className="my-8 border-t border-[#2c2f30]" />

        {/* Coming Soon Section */}
        <div className="space-y-3">
          {comingSoonItems.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between px-5 py-4 rounded-xl text-[16px] text-gray-500"
            >
              <span>{item.name}</span>
              <div className="flex items-center gap-4">
                <span className="text-[13px]">Coming Soon</span>
                <div className="w-6 h-6">
                  {item.icon}
                </div>
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Profile Link */}
      <div className="p-5">
        <Link
          href="/app/profile"
          className={`flex items-center justify-between px-5 py-4 rounded-xl text-[16px] font-medium transition-colors ${
            pathname === '/app/profile'
              ? 'bg-[#7B6EF6] text-white'
              : 'text-gray-300 hover:bg-[#2c2f30] hover:text-white'
          }`}
        >
          <span>Profile</span>
          <div className="w-6 h-6">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </Link>
      </div>
    </>
  );

  if (!isMounted) {
    return null;
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-4 right-4 z-50 p-2 rounded-lg bg-[#232627] lg:hidden"
      >
        <svg
          className="w-6 h-6 text-white"
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

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-[320px] p-4 bg-[#141718]">
        <div className="bg-[#232627] rounded-2xl h-[calc(100vh-128px)] flex flex-col shadow-xl">
          {sidebarContent}
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-0 z-40 lg:hidden ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        } transition-opacity duration-300`}
      >
        <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
        <div
          className={`absolute left-0 top-0 h-full w-[320px] bg-[#232627] transform transition-transform duration-300 ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {sidebarContent}
        </div>
      </div>
    </>
  );
} 