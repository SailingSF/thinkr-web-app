import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Settings, Plus, Hexagon, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { useNavigation } from '@/contexts/NavigationContext';

export default function AppSidebar() {
  const pathname = usePathname();
  const { isSidebarOpen, setIsSidebarOpen } = useNavigation();
  const [isMounted, setIsMounted] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isSettings = pathname === '/app/profile';
  const isChat = pathname === '/app';
  const isAgents = pathname === '/app/scheduler';
  const isIntegrations = pathname === '/app/integrations';
  const isTemplates = pathname === '/app/agent-templates';

  const handleNav = () => {
    // Navigation handler if needed
  };

  if (!isMounted) {
    return null;
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed top-0 left-0 h-screen w-64 z-30">
        <div className={`transition-all duration-300 ${
          isSidebarOpen ? "w-64" : "w-16"
        } bg-black border-r border-black p-0 flex flex-col h-full`}>
          <div className="flex flex-col h-full w-full">
            {!isSidebarOpen ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="hover:bg-gray-700 hover:text-white mt-6 mb-6 mx-auto"
                >
                  <ChevronRight className="h-6 w-6 text-white" />
                </Button>
                <Link href="/app" onClick={handleNav}>
                  <div className="h-10 w-10 mx-auto mb-6 cursor-pointer flex items-center justify-center">
                    {!imageError ? (
                      <Image
                        src="/thinkr-icon-latest.png"
                        alt="Logo Icon"
                        width={40}
                        height={40}
                        className="object-contain"
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <div className="text-white text-lg font-bold">T</div>
                    )}
                  </div>
                </Link>
                <nav className="flex flex-col items-center space-y-4 w-full mt-4 flex-1">
                  <Link
                    href="/app"
                    onClick={() => { window.dispatchEvent(new Event('thinkr:new-chat')); handleNav && handleNav(); }}
                    className={`flex items-center justify-center w-12 h-12 mx-auto rounded-lg transition-colors text-[#A78BFA] ${
                      isChat
                        ? "font-bold shadow-none hover:bg-[#A78BFA]/10 hover:font-bold"
                        : "font-medium hover:font-bold hover:bg-[#A78BFA]/10"
                    }`}
                  >
                    <Plus className="h-6 w-6 text-[#A78BFA]" />
                  </Link>
                  <Link
                    href="/app/scheduler"
                    onClick={handleNav}
                    className={`flex items-center justify-center w-12 h-12 mx-auto rounded-lg transition-colors ${
                      isAgents
                        ? "bg-gray-700 text-white"
                        : "text-white hover:bg-gray-700 hover:text-white"
                    }`}
                  >
                    <Hexagon className={`h-6 w-6 ${isAgents ? "text-white" : ""}`} />
                  </Link>
                  <Link
                    href="/app/integrations"
                    onClick={handleNav}
                    className={`flex items-center justify-center w-12 h-12 mx-auto rounded-lg transition-colors ${
                      isIntegrations
                        ? "bg-gray-700 text-white"
                        : "text-white hover:bg-gray-700 hover:text-white"
                    }`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </Link>
                </nav>
                <div className="w-full flex flex-col items-center pb-6 mt-auto">
                  <Link
                    href="/app/agent-templates"
                    className={`flex items-center justify-center w-12 h-12 mx-auto rounded-lg transition-colors mb-2 ${
                      isTemplates
                        ? 'bg-gray-700 text-white'
                        : 'text-white hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <FileText className="h-6 w-6" />
                  </Link>
                  <Link
                    href="/app/profile"
                    onClick={handleNav}
                    className={`flex items-center justify-center w-12 h-12 mx-auto rounded-lg transition-colors ${
                      isSettings
                        ? "bg-gray-700 text-white"
                        : "text-white hover:bg-gray-700 hover:text-white"
                    }`}
                  >
                    <Settings className={`h-6 w-6 ${isSettings ? "text-white" : ""}`} />
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between w-full px-4 pt-6 pb-4">
                  <Link href="/app" onClick={handleNav}>
                    {!imageError ? (
                      <div className="flex items-center h-14">
                        <Image
                          src="/thinkr-logo-white.png"
                          alt="Logo"
                          height={56}
                          width={168}
                          className="h-14 w-auto object-contain cursor-pointer"
                          onError={() => setImageError(true)}
                        />
                      </div>
                    ) : (
                      <div className="text-white text-xl font-bold ml-2 cursor-pointer">THINKR</div>
                    )}
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="hover:bg-gray-700 hover:text-white"
                  >
                    <ChevronLeft className="h-4 w-4 text-white" />
                  </Button>
                </div>
                <nav className="flex-1 flex flex-col space-y-2 px-4 mt-8">
                  <Link
                    href="/app"
                    onClick={() => { window.dispatchEvent(new Event('thinkr:new-chat')); handleNav && handleNav(); }}
                    className={`flex items-center gap-3 p-2 rounded-lg w-full transition-colors text-[#A78BFA] ${
                      isChat
                        ? "font-bold shadow-none hover:bg-[#A78BFA]/10 hover:font-bold"
                        : "font-medium hover:font-bold hover:bg-[#A78BFA]/10"
                    }`}
                  >
                    <Plus className="h-5 w-5 text-[#A78BFA]" />
                    <span className="font-bold">New chat</span>
                  </Link>
                  <Link
                    href="/app/scheduler"
                    onClick={handleNav}
                    className={`flex items-center gap-3 p-2 rounded-lg w-full transition-colors ${
                      isAgents
                        ? "bg-gray-700 text-white"
                        : "text-white hover:bg-gray-700 hover:text-white"
                    }`}
                  >
                    <Hexagon className={`h-5 w-5 ${isAgents ? "text-white" : ""}`} />
                    <span>Agents</span>
                  </Link>
                  <Link
                    href="/app/integrations"
                    onClick={handleNav}
                    className={`flex items-center gap-3 p-2 rounded-lg w-full transition-colors ${
                      isIntegrations
                        ? "bg-gray-700 text-white"
                        : "text-white hover:bg-gray-700 hover:text-white"
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span>Integrations</span>
                  </Link>
                </nav>
                <div className="w-full px-4 pb-6 mt-auto">
                  <Link
                    href="/app/agent-templates"
                    className={`flex items-center gap-3 p-2 rounded-lg w-full transition-colors mb-2 ${
                      isTemplates
                        ? 'bg-gray-700 text-white'
                        : 'text-white hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <FileText className="h-5 w-5" />
                    <span>Templates</span>
                  </Link>
                  <Link
                    href="/app/profile"
                    onClick={handleNav}
                    className={`flex items-center gap-3 p-2 rounded-lg w-full transition-colors ${
                      isSettings
                        ? "bg-gray-700 text-white"
                        : "text-white hover:bg-gray-700 hover:text-white"
                    }`}
                  >
                    <Settings className={`h-5 w-5 ${isSettings ? "text-white" : ""}`} />
                    <span>Settings</span>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 right-4 z-50 p-2 rounded-lg bg-black lg:hidden md:left-4 md:right-auto md:top-4 md:block"
        style={{ left: undefined, right: undefined }}
      >
        <svg
          className="w-5 h-5 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isSidebarOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-0 z-40 lg:hidden ${
          isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        } transition-opacity duration-300`}
      >
        <div className="absolute inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)} />
        <div
          className={`absolute left-0 top-0 h-full w-64 bg-black transform transition-transform duration-300 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full w-full">
            <div className="flex items-center justify-between w-full px-4 pt-6 pb-4">
              <Link href="/app" onClick={() => setIsSidebarOpen(false)}>
                {!imageError ? (
                  <div className="flex items-center h-14">
                    <Image
                      src="/thinkr-logo-white.png"
                      alt="Logo"
                      height={56}
                      width={168}
                      className="h-14 w-auto object-contain cursor-pointer"
                      onError={() => setImageError(true)}
                    />
                  </div>
                ) : (
                  <div className="text-white text-xl font-bold ml-2 cursor-pointer">THINKR</div>
                )}
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(false)}
                className="hover:bg-gray-700 hover:text-white md:hidden"
              >
                <ChevronLeft className="h-4 w-4 text-white" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(false)}
              className="hidden md:flex fixed top-8 right-4 z-50 bg-black hover:bg-gray-700 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4 text-white" />
            </Button>
            <nav className={`flex-1 flex flex-col space-y-2 px-4 mt-8 ${
              'md:items-center md:space-y-4 md:w-full md:mt-4 md:flex-1'
            }`}>
              <Link
                href="/app"
                onClick={() => { window.dispatchEvent(new Event('thinkr:new-chat')); handleNav && handleNav(); }}
                className={`flex items-center gap-3 p-2 rounded-lg w-full transition-colors text-[#A78BFA] ${
                  isChat
                    ? "font-bold shadow-none hover:bg-[#A78BFA]/10 hover:font-bold"
                    : "font-medium hover:font-bold hover:bg-[#A78BFA]/10"
                }`}
              >
                <Plus className="h-5 w-5 text-[#A78BFA]" />
                <span className="font-bold">New chat</span>
              </Link>
              <Link
                href="/app/scheduler"
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 p-2 rounded-lg w-full transition-colors ${
                  isAgents
                    ? "md:bg-gray-700 md:text-white bg-gray-700 text-white"
                    : "md:text-white md:hover:bg-gray-700 md:hover:text-white text-white hover:bg-gray-700 hover:text-white"
                }`}
              >
                <Hexagon className={`h-5 w-5 ${isAgents ? "md:text-white text-white" : "md:text-white text-white"}`} />
                <span>Agents</span>
              </Link>
              <Link
                href="/app/integrations"
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 p-2 rounded-lg w-full transition-colors ${
                  isIntegrations
                    ? "md:bg-gray-700 md:text-white bg-gray-700 text-white"
                    : "md:text-white md:hover:bg-gray-700 md:hover:text-white text-white hover:bg-gray-700 hover:text-white"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span>Integrations</span>
              </Link>
            </nav>
            <div className="w-full px-4 pb-6 mt-auto">
              <Link
                href="/app/agent-templates"
                className={`flex items-center gap-3 p-2 rounded-lg w-full transition-colors mb-2 ${
                  isTemplates
                    ? 'bg-gray-700 text-white'
                    : 'text-white hover:bg-gray-700 hover:text-white'
                }`}
              >
                <FileText className="h-5 w-5" />
                <span>Templates</span>
              </Link>
              <Link
                href="/app/profile"
                onClick={handleNav}
                className={`flex items-center gap-3 p-2 rounded-lg w-full transition-colors ${
                  isSettings
                    ? "md:bg-gray-700 md:text-white bg-gray-700 text-white"
                    : "md:text-white md:hover:bg-gray-700 md:hover:text-white text-white hover:bg-gray-700 hover:text-white"
                }`}
              >
                <Settings className={`h-5 w-5 ${isSettings ? "md:text-white text-white" : "md:text-white text-white"}`} />
                <span>Settings</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}