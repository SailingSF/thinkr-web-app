import Link from "next/link";
import { RegisterForm } from "./RegisterForm";

export default function Register() {
  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white">
      {/* Navigation */}
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
            Login
          </Link>
        </div>
      </nav>

      {/* Registration Form */}
      <main className="flex flex-col items-center justify-center px-8 pt-20 pb-32">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Create your account</h2>
            <p className="mt-2 text-gray-400">Start analyzing your Shopify store</p>
          </div>

          <RegisterForm />

          <p className="text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="text-purple-400 hover:text-purple-300">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
} 