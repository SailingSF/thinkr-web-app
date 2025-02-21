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
  // Hardcoded cal.com link
  const CAL_LINK = 'https://cal.com/edu-samayoa-im7mvi';

  console.log('ShopifyErrorModal props:', { isOpen, error, userEmail });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#25262b] rounded-xl max-w-lg w-full mx-4 p-6 border border-purple-400/20">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-white">Connection Error</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="text-red-400 mb-4 p-4 bg-red-500/10 rounded space-y-2">
          <div className="font-semibold">{error.split(':')[0]}</div>
          {error.includes(':') && (
            <div className="text-sm opacity-90">{error.split(':')[1].trim()}</div>
          )}
        </div>

        <div className="space-y-4 text-gray-300">
          <h3 className="font-semibold text-white">To connect your store, please follow these steps:</h3>
          
          <div className="space-y-2">
            <p className="flex items-start gap-2">
              <span className="text-purple-400">1.</span>
              Install our Shopify app from the{' '}
              <a
                href="https://apps.shopify.com/thinkr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:underline"
              >
                Shopify App Store
              </a>
            </p>

            {userEmail && (
              <p className="flex items-start gap-2">
                <span className="text-purple-400">2.</span>
                Ensure you&apos;re using the same email ({userEmail}) in your Shopify account
              </p>
            )}

            <p className="flex items-start gap-2">
              <span className="text-purple-400">3.</span>
              Make sure you have admin access to your Shopify store
            </p>
          </div>

          <div className="border-t border-gray-700 pt-4 mt-6">
            <p className="mb-3">Need help? Book a 15-minute call with our team:</p>
            <a
              href={CAL_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded-lg text-white transition-colors"
            >
              Schedule a Call
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 