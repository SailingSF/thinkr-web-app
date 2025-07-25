'use client';

import AppSidebar from "@/components/AppSidebar";
import Navigation from "@/components/Navigation";
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { NavigationProvider, useNavigation } from '@/contexts/NavigationContext';

function AppLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading } = useAuth();
  const { isSidebarOpen } = useNavigation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#141718] flex items-center justify-center">
        <div className="text-xl text-purple-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#141718]">
      <Navigation />
      <AppSidebar />
      <main className={`flex-1 p-4 overflow-auto dark-scrollbar transition-all duration-300 ${
        isSidebarOpen ? 'lg:pl-64' : 'lg:pl-20'
      }`}>
        {children}
      </main>
    </div>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <NavigationProvider>
        <AppLayoutContent>
          {children}
        </AppLayoutContent>
      </NavigationProvider>
    </AuthProvider>
  );
} 