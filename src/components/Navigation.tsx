import Link from "next/link";

export default function Navigation() {
  return (
    <nav className="flex items-center justify-between p-6 border-b border-gray-800">
      <Link href="/" className="flex items-center gap-2">
        <div className="text-2xl font-bold text-purple-400">thinkr</div>
      </Link>
      <div className="flex items-center gap-8">
        <Link href="/" className="hover:text-purple-400 transition-colors py-2">Home</Link>
        <Link href="/app" className="hover:text-purple-400 transition-colors py-2">App</Link>
        <Link href="/faq" className="hover:text-purple-400 transition-colors py-2">FAQ</Link>
        <Link 
          href="/login" 
          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-md transition-colors"
        >
          Connect Store
        </Link>
      </div>
    </nav>
  );
} 