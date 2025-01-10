import React from 'react';
import Image from 'next/image';

interface ShopifyConnectButtonProps {
  onClick: () => void;
  isLoading: boolean;
  className?: string;
}

export default function ShopifyConnectButton({ onClick, isLoading, className = '' }: ShopifyConnectButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`w-full py-4 bg-[#5E8E3E] hover:bg-[#4A7131] rounded-lg transition-colors text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 ${className}`}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Connecting to Shopify...</span>
        </>
      ) : (
        <>
          <Image
            src="/shopify_glyph_white.svg"
            alt="Shopify logo"
            width={24}
            height={24}
            className="w-6 h-6"
          />
          <span>Connect with Shopify</span>
        </>
      )}
    </button>
  );
} 