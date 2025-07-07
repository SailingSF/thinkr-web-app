import { ReactNode } from 'react';
import { ShopifyAppBridgeProvider, isShopifyEmbedded } from '@/utils/shopify';
import Navigation from './Navigation';

interface HybridLayoutProps {
  children: ReactNode;
}

export default function HybridLayout({ children }: HybridLayoutProps) {
  const isEmbedded = isShopifyEmbedded();
  return (
    <ShopifyAppBridgeProvider>
      <div className={`min-h-screen ${isEmbedded ? '' : 'bg-[#141718] text-white'} ${!isEmbedded ? 'overflow-hidden' : ''}`}>
        {/* Only show navigation in standalone mode */}
        {!isEmbedded && <Navigation />}
        {/* Main content */}
        <main className={`${isEmbedded ? 'p-4' : 'container mx-auto px-0 py-0'}`} style={{ backgroundColor: !isEmbedded ? '#141718' : undefined }}>
          {children}
        </main>
      </div>
    </ShopifyAppBridgeProvider>
  );
} 