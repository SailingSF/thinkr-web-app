'use client';

import Link from "next/link";
import Image from "next/image";
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const NAVIGATION_LINKS = {
  public: [
    { href: '/', label: 'Home' },
    { href: '/app', label: 'App' },
    { href: '/faq', label: 'FAQ' },
  ],
  authenticated: [
    { href: '/faq', label: 'Help' }
  ]
};

interface NavigationProps {
  onLogout?: () => void;
}

export default function Navigation({ onLogout }: NavigationProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const isAuthenticated = pathname.startsWith('/app') || 
                         pathname.startsWith('/recommendations') || 
                         pathname.startsWith('/settings');

  const handleLogout = () => {
    logout();
    onLogout?.();
  };

  const navigationLinks = isAuthenticated ? NAVIGATION_LINKS.authenticated : NAVIGATION_LINKS.public;

  return (
    <nav className="flex items-center justify-between h-24 px-8 border-b border-gray-800">
      <Link href={isAuthenticated ? '/app' : '/'} className="flex items-center">
        <Image
          src="/2 Thinkr logo white letter.png"
          alt="Thinkr Logo"
          width={120}
          height={40}
          priority
          className="object-contain"
        />
      </Link>

      <div className="flex items-center h-full">
        {navigationLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`h-full flex items-center px-5 text-base hover:text-purple-400 transition-colors ${
              pathname === href ? 'text-purple-400' : 'text-gray-400'
            }`}
          >
            {label}
          </Link>
        ))}

        {isAuthenticated ? (
          <button 
            onClick={handleLogout}
            className="h-10 ml-5 px-8 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors text-white text-base flex items-center"
          >
            Logout
          </button>
        ) : (
          <Link 
            href="/login" 
            className="h-10 ml-5 px-8 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors text-white text-base flex items-center"
          >
            Connect Store
          </Link>
        )}
      </div>
    </nav>
  );
} 