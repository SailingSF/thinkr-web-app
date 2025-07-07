'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface NavigationContextType {
  showLogo: boolean;
  setShowLogo: (show: boolean) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [showLogo, setShowLogo] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <NavigationContext.Provider value={{ 
      showLogo, 
      setShowLogo, 
      isSidebarOpen, 
      setIsSidebarOpen 
    }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    // Return safe fallback values instead of throwing error
    console.warn('useNavigation must be used within a NavigationProvider, using fallback values');
    return {
      showLogo: false,
      setShowLogo: () => {},
      isSidebarOpen: true,
      setIsSidebarOpen: () => {}
    };
  }
  return context;
} 