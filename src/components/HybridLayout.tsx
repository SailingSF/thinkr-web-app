import { ReactNode } from 'react';
import { ShopifyAppBridgeProvider, isShopifyEmbedded } from '@/utils/shopify';
import Navigation from './Navigation';

interface HybridLayoutProps {
  children: ReactNode;
  onLogout?: () => void;
}

export default function HybridLayout({ children, onLogout }: HybridLayoutProps) {
  return (
    <ShopifyAppBridgeProvider>
      <div className={`min-h-screen ${isShopifyEmbedded() ? '' : 'bg-[#1a1b1e] text-white'}`}>
        {/* Only show navigation in standalone mode */}
        {!isShopifyEmbedded() && <Navigation onLogout={onLogout} />}
        
        {/* Main content */}
        <main className={`${isShopifyEmbedded() ? 'p-4' : 'container mx-auto px-8 py-12'}`}>
          {children}
        </main>
      </div>
    </ShopifyAppBridgeProvider>
  );
} 