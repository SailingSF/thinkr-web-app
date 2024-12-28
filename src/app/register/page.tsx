import Link from "next/link";
import Navigation from "@/components/Navigation";
import { RegisterForm } from "./RegisterForm";

export default function Register() {
  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white">
      <Navigation />

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