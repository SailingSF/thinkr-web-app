'use client';

import { useState } from 'react';
import { useAuthFetch } from '@/utils/shopify';

export default function DeepResearch() {
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const authFetch = useAuthFetch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    setError('');

    try {
      const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/deep-research/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to start research');
      }

      setStatus('success');
      setPrompt('');
    } catch (err) {
      setError('Failed to submit research request. Please try again.');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#141718] py-8 lg:py-12 font-inter">
      <div className="h-full overflow-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#2C2D32]/20 [&::-webkit-scrollbar-thumb]:bg-[#2C2D32] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#3C3D42] scrollbar-thin scrollbar-track-[#2C2D32]/20 scrollbar-thumb-[#2C2D32] hover:scrollbar-thumb-[#3C3D42]">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Title Section */}
          <div className="mb-12">
            <h1 className="text-[35px] text-[#8B5CF6] font-normal mb-2">
              Deep Research
            </h1>
            <p className="text-[22px] text-white font-normal mb-8">
              Get AI-powered research insights for your e-commerce business.
            </p>
            <hr className="border-t border-white mb-10" />
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Main Content - Left Aligned */}
            <div className="max-w-2xl">
              <div className="bg-[#1E1F20] rounded-2xl p-8 shadow-lg">
                <p className="text-gray-300 mb-8">
                  Submit your e-commerce research question, and our AI agent will conduct thorough research via the web and the latest AI reasoning models, then email you the results.
                </p>

                {status === 'success' ? (
                  <div className="bg-[#232627] rounded-lg p-6 text-center">
                    <svg className="w-12 h-12 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-xl text-white mb-2">Research Started!</h3>
                    <p className="text-gray-300">
                      We'll email you the results of your deep research soon.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="What would you like us to research? (e.g., 'What are the most effective customer retention strategies for my store?')"
                        className="w-full h-32 px-4 py-3 bg-[#232627] text-white rounded-lg focus:ring-2 focus:ring-[#7B6EF6] focus:outline-none resize-none"
                        required
                      />
                    </div>

                    {error && (
                      <div className="text-red-500 text-sm">{error}</div>
                    )}

                    <button
                      type="submit"
                      disabled={status === 'submitting'}
                      className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${
                        status === 'submitting'
                          ? 'bg-[#7B6EF6]/50 cursor-not-allowed'
                          : 'bg-[#7B6EF6] hover:bg-[#7B6EF6]/90'
                      }`}
                    >
                      {status === 'submitting' ? 'Starting Research...' : 'Start Deep Research'}
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Examples Section - Right Side */}
            <div className="space-y-6 hidden lg:block">
              <h2 className="text-xl text-white mb-6">Example Research Questions</h2>
              
              <div className="space-y-4">
                <div className="bg-[#1E1F20] rounded-lg p-6">
                  <h3 className="text-[#8B5CF6] text-lg mb-2">Market Analysis</h3>
                  <p className="text-gray-300">"What are the emerging trends in sustainable fashion for online retailers?"</p>
                </div>

                <div className="bg-[#1E1F20] rounded-lg p-6">
                  <h3 className="text-[#8B5CF6] text-lg mb-2">Customer Behavior</h3>
                  <p className="text-gray-300">"How do seasonal changes affect buying patterns in home decor?"</p>
                </div>

                <div className="bg-[#1E1F20] rounded-lg p-6">
                  <h3 className="text-[#8B5CF6] text-lg mb-2">Competitive Analysis</h3>
                  <p className="text-gray-300">"What pricing strategies are successful stores using for premium products?"</p>
                </div>

                <div className="bg-[#1E1F20] rounded-lg p-6">
                  <h3 className="text-[#8B5CF6] text-lg mb-2">Marketing Strategy</h3>
                  <p className="text-gray-300">"Which social media platforms are most effective for reaching Gen Z customers?"</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
