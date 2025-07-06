'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatIntent } from '@/types/chat';
import { Settings, ChevronDown, Database } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export interface Connection {
  id: string;
  name: string;
  iconUrl: string;
  enabled: boolean;
}

interface SegmentedModeSelectorProps {
  mode: ChatIntent;
  onChange: (mode: ChatIntent) => void;
  disabled?: boolean;
  connections?: Connection[];
  hasShopifyConnection?: boolean;
  className?: string;
}

const modes = [
  {
    value: 'ask' as ChatIntent,
    label: '+ Ask',
  },
  {
    value: 'research' as ChatIntent,
    label: 'Research',
  },
  {
    value: 'agent_builder' as ChatIntent,
    label: 'Agents',
  },
];

// Available integrations with their icons
const AVAILABLE_INTEGRATIONS = [
  { id: 'shopify', name: 'Shopify', icon: '/shopify_glyph_white.svg' },
  { id: 'google_ads', name: 'Google Ads', icon: '/google-ads-icon-2.png' },
  { id: 'facebook_ads', name: 'Meta Ads', icon: '/meta-icon-2.png' },
  { id: 'google_analytics_4', name: 'Google Analytics', icon: '/google-analytics-icon.png' },
  { id: 'klaviyo', name: 'Klaviyo', icon: '/klaviyo-white-icon.png' },
  { id: 'gorgias', name: 'Gorgias', icon: '/gorgias-icon.png' },
  { id: 'pinterest_ads', name: 'Pinterest Ads', icon: '/pinterest-icon.png' },
];

export default function SegmentedModeSelector({ 
  mode, 
  onChange, 
  disabled = false,
  connections = [],
  hasShopifyConnection = false,
  className = ''
}: SegmentedModeSelectorProps) {
  const [showIntegrations, setShowIntegrations] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowIntegrations(false);
      }
    }

    if (showIntegrations) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showIntegrations]);

  // Build list of connected integrations
  const getConnectedIntegrations = () => {
    const connected: Connection[] = [];
    
    // Add Shopify if connected
    if (hasShopifyConnection) {
      const shopifyIntegration = AVAILABLE_INTEGRATIONS.find(i => i.id === 'shopify');
      if (shopifyIntegration) {
        connected.push({
          id: 'shopify',
          name: 'Shopify',
          iconUrl: shopifyIntegration.icon,
          enabled: true
        });
      }
    }
    
    // Add other connections from props
    connected.push(...connections);
    
    return connected;
  };

  const connectedIntegrations = getConnectedIntegrations();
  const hasConnections = connectedIntegrations.length > 0;

  return (
    <div className={`w-full ${className}`}>
      <div className="flex flex-col sm:flex-row w-full gap-1 sm:gap-0 items-center">
        {/* First row: Mode buttons */}
        <div className="flex w-full bg-transparent p-0 sm:p-1 justify-start items-center min-h-[40px]">
          {modes.map((modeOption) => (
            <button
              key={modeOption.value}
              onClick={() => onChange(modeOption.value)}
              disabled={disabled}
              className={`
                px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-200 min-w-[60px] sm:min-w-[80px] rounded-lg
                ${mode === modeOption.value 
                  ? 'bg-[#7366FF] text-white shadow-sm' 
                  : 'bg-transparent text-gray-300 hover:text-white hover:bg-[#232425]'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {modeOption.label}
            </button>
          ))}
        </div>
        {/* Second row: Integrations (mobile only), right-aligned on desktop */}
        <div className="flex w-full sm:w-auto justify-start sm:justify-end mt-1 sm:mt-0 items-center min-h-[40px]">
          <div className="relative flex items-center h-full">
            <button
              onClick={() => setShowIntegrations(!showIntegrations)}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 bg-[#232425] hover:bg-[#232425]/80 text-gray-300 hover:text-white rounded-lg text-xs sm:text-sm transition-colors border-l border-[#232425] h-full"
            >
              <span>Integrations</span>
              <Database className="h-3 w-3 sm:h-4 sm:w-4" />
              {hasConnections && (
                <span className="flex gap-1 items-center">
                  {connectedIntegrations.slice(0, 3).map((connection) => (
                    <div
                      key={connection.id}
                      className="relative w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#1A1B1C] border border-[#3A3D3E] flex items-center justify-center overflow-hidden"
                    >
                      <Image 
                        src={connection.iconUrl} 
                        alt={connection.name}
                        width={12}
                        height={12}
                        className="object-contain"
                      />
                    </div>
                  ))}
                  {connectedIntegrations.length > 3 && (
                    <div className="relative w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#1A1B1C] border border-[#3A3D3E] flex items-center justify-center text-[10px] sm:text-xs text-gray-400">
                      +{connectedIntegrations.length - 3}
                    </div>
                  )}
                </span>
              )}
              <ChevronDown className={`h-2 w-2 sm:h-3 sm:w-3 transition-transform ${showIntegrations ? '' : 'rotate-180'}`} />
            </button>
            {/* Integrations Dropdown */}
            {showIntegrations && (
              <div className="absolute bottom-full mb-2 right-0 w-56 sm:w-80 bg-[#2A2D2E] border border-[#3A3D3E] rounded-lg shadow-lg z-50">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-medium">Connected Data Sources</h3>
                    <Link href="/app/integrations">
                      <button className="text-[#7B6EF6] hover:text-[#6A5ACD] text-xs sm:text-sm transition-colors">
                        Manage
                      </button>
                    </Link>
                  </div>
                  {hasConnections ? (
                    <div className="space-y-2">
                      {connectedIntegrations.map((connection) => (
                        <div
                          key={connection.id}
                          className="flex items-center gap-2 sm:gap-3 p-1 sm:p-2 rounded-md bg-[#1A1B1C]"
                        >
                          <div className="relative w-4 h-4 sm:w-6 sm:h-6 flex items-center justify-center">
                            <Image 
                              src={connection.iconUrl} 
                              alt={connection.name}
                              width={14}
                              height={14}
                              className="object-contain"
                            />
                          </div>
                          <span className="text-white text-xs sm:text-sm flex-1">{connection.name}</span>
                          <div className={`w-2 h-2 rounded-full ${connection.enabled ? 'bg-green-500' : 'bg-gray-500'}`} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-2 sm:py-4">
                      <p className="text-gray-400 text-xs sm:text-sm mb-2 sm:mb-3">No data sources connected</p>
                      <Link href="/app/integrations">
                        <button className="px-2 sm:px-4 py-1 sm:py-2 bg-[#7B6EF6] hover:bg-[#6A5ACD] text-white text-xs sm:text-sm rounded-md transition-colors">
                          Connect Data Sources
                        </button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}