import React from 'react';

interface ShopifyErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: string;
  userEmail?: string;
}

export default function ShopifyErrorModal({
  isOpen,
  onClose,
  error,
  userEmail,
}: ShopifyErrorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1A1B1E] rounded-lg max-w-md w-full mx-4 p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl text-white">Connection Incomplete</h2>
            <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
              <span className="text-red-500 text-xs">!</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <a
          href="https://apps.shopify.com/thinkr"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-[#10AA56] hover:bg-[#338452] text-black font-medium text-center py-3 rounded-sm mb-8 transition-colors"
        >
          Install Shopify App
        </a>

        <div className="space-y-4 text-gray-400">
          <div className="flex gap-3">
            <span className="text-gray-500">1.</span>
            <p>Install our Shopify App from the Shopify App Store</p>
          </div>

          <div className="flex gap-3">
            <span className="text-gray-500">2.</span>
            <p>Make sure you have admin access to the Shopify store you wish to connect.</p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-800">
          <p className="text-gray-400">
            Need help? Book a{' '}
            <a 
              href="https://cal.com/edu-samayoa-im7mvi"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 underline hover:text-white"
            >
              15-minute call
            </a>
            {' '}with our team.
          </p>
        </div>
      </div>
    </div>
  );
} 