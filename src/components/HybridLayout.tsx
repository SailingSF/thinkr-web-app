import { ReactNode } from 'react';
import { ShopifyAppBridgeProvider, isShopifyEmbedded } from '@/utils/shopify';
import Navigation from './Navigation';

interface HybridLayoutProps {
  children: ReactNode;
}

export default function HybridLayout({ children }: HybridLayoutProps) {
  return (
    <ShopifyAppBridgeProvider>
      <div className={`min-h-screen ${isShopifyEmbedded() ? '' : 'bg-[#16141C] text-white'}`}>
        {/* Only show navigation in standalone mode */}
        {!isShopifyEmbedded() && <Navigation />}
        
        {/* Main content */}
        <main className={`${isShopifyEmbedded() ? 'p-4' : 'container mx-auto px-8 py-12'}`}>
          {children}
        </main>
      </div>
    </ShopifyAppBridgeProvider>
  );
} 