import Link from "next/link";
import Navigation from "@/components/Navigation";

export default function App() {
  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white">
      <Navigation />

      {/* App Content */}
      <main className="flex flex-col items-center justify-center px-8 pt-20 pb-32">
        <div className="text-center max-w-md">
          <h2 className="text-3xl font-bold mb-4">Access Required</h2>
          <p className="text-gray-400 mb-8">
            Please log in to access the thinkr dashboard and analytics.
          </p>
          <Link 
            href="/login"
            className="inline-block px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-md transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </main>
    </div>
  );
} 