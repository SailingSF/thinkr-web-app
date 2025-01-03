'use client';

import Link from "next/link";
import Image from "next/image";
import { usePathname } from 'next/navigation';

interface NavigationProps {
  onLogout?: () => void;
}

export default function Navigation({ onLogout }: NavigationProps) {
  const pathname = usePathname();
  const isLoggedIn = pathname.startsWith('/dashboard');

  return (
    <nav className="flex items-center justify-between p-6 border-b border-gray-800">
      <Link href="/" className="flex items-center gap-2">
        <Image
          src="/2 Thinkr logo white letter.png"
          alt="Thinkr Logo"
          width={120}
          height={40}
          className="object-contain"
        />
      </Link>
      <div className="flex items-center gap-8">
        {isLoggedIn ? (
          <>
            <Link href="/dashboard" className="hover:text-purple-400 transition-colors py-2">Dashboard</Link>
            <button 
              onClick={onLogout}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-md transition-colors"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/" className="hover:text-purple-400 transition-colors py-2">Home</Link>
            <Link href="/app" className="hover:text-purple-400 transition-colors py-2">App</Link>
            <Link href="/faq" className="hover:text-purple-400 transition-colors py-2">FAQ</Link>
            <Link 
              href="/login" 
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-md transition-colors"
            >
              Connect Store
            </Link>
          </>
        )}
      </div>
    </nav>
  );
} 