import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#25262b] border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-center items-center gap-8 text-gray-400">
          <Link href="/privacy" className="hover:text-purple-400 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/pricing" className="hover:text-purple-400 transition-colors">
            Pricing
          </Link>
          <Link href="/team" className="hover:text-purple-400 transition-colors">
            Team
          </Link>
        </div>
        <div className="text-center mt-6 text-gray-500">
          © {new Date().getFullYear()} thinkr. All rights reserved.
        </div>
      </div>
    </footer>
  );
} 