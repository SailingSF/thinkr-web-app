'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface NavigationContextType {
  showLogo: boolean;
  setShowLogo: (show: boolean) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [showLogo, setShowLogo] = useState(false);

  return (
    <NavigationContext.Provider value={{ showLogo, setShowLogo }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
} 