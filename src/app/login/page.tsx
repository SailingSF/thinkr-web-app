import Link from "next/link";

export default function Login() {
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

      {/* Login Form */}
      <main className="flex flex-col items-center justify-center px-8 pt-20 pb-32">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Welcome back</h2>
            <p className="mt-2 text-gray-400">Sign in to your account</p>
          </div>

          <form className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 w-full px-4 py-3 rounded bg-[#25262b] border border-gray-700 focus:border-purple-400 focus:outline-none"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 w-full px-4 py-3 rounded bg-[#25262b] border border-gray-700 focus:border-purple-400 focus:outline-none"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-700 bg-[#25262b] text-purple-500 focus:ring-purple-500"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="text-purple-400 hover:text-purple-300">
                  Forgot your password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-purple-500 hover:bg-purple-600 rounded font-medium transition-colors"
            >
              Sign in
            </button>
          </form>

          <p className="text-center text-sm text-gray-400">
            Don't have an account?{' '}
            <Link href="/" className="text-purple-400 hover:text-purple-300">
              Sign up
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
} 