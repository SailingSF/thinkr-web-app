import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="text-2xl font-bold text-purple-400">thinkr</div>
        </Link>
        <Link 
          href="/login" 
          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-md transition-colors"
        >
          Connect Store
        </Link>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-8">
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="relative">
            {/* Central circle with pulsing effect */}
            <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
            
            <div className="relative bg-[#25262b] p-12 rounded-2xl border border-purple-400/20 max-w-xl text-center">
              <h1 className="text-5xl font-bold mb-6">
                Your Shopify store,
                <span className="block text-purple-400 mt-2">but smarter</span>
              </h1>
              
              <div className="flex flex-col items-center gap-8 mt-12">
                <div className="flex items-center gap-6 text-xl text-gray-400">
                  <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                  Real-time metrics
                  <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                  Smart automations
                  <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                </div>
                
                <Link 
                  href="/login"
                  className="px-8 py-4 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors text-lg font-medium"
                >
                  Connect your Shopify store
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
