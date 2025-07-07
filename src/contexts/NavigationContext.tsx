'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface NavigationContextType {
  showLogo: boolean;
  setShowLogo: (show: boolean) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [showLogo, setShowLogo] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <NavigationContext.Provider value={{ 
      showLogo, 
      setShowLogo, 
      isSidebarCollapsed, 
      setIsSidebarCollapsed 
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
      isSidebarCollapsed: false,
      setIsSidebarCollapsed: () => {}
    };
  }
  return context;
} 