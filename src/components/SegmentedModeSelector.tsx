'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatIntent } from '@/types/chat';
import { Settings, ChevronDown } from 'lucide-react';
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
}

const modes = [
  {
    value: 'ask' as ChatIntent,
    label: 'Ask',
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
  hasShopifyConnection = false
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
    <div className="flex items-center gap-4">
      {/* Mode Selector */}
      <div className="flex bg-[#2A2D2E] rounded-lg p-1">
        {modes.map((modeOption) => (
          <button
            key={modeOption.value}
            onClick={() => onChange(modeOption.value)}
            disabled={disabled}
            className={`
              px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 min-w-[80px]
              ${mode === modeOption.value 
                ? 'bg-[#7B6EF6] text-white shadow-sm' 
                : 'text-gray-300 hover:text-white hover:bg-[#3A3D3E]'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {modeOption.label}
          </button>
        ))}
      </div>

             {/* Integrations Section */}
       <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowIntegrations(!showIntegrations)}
          className="flex items-center gap-2 px-3 py-2 bg-[#2A2D2E] hover:bg-[#3A3D3E] text-gray-300 hover:text-white rounded-lg text-sm transition-colors"
        >
          <Settings className="h-4 w-4" />
          <span>Integrations</span>
                     {hasConnections && (
             <span className="flex gap-1">
               {connectedIntegrations.slice(0, 3).map((connection) => (
                <div
                  key={connection.id}
                  className="relative w-5 h-5 rounded-full bg-[#1A1B1C] border border-[#3A3D3E] flex items-center justify-center overflow-hidden"
                >
                  <Image 
                    src={connection.iconUrl} 
                    alt={connection.name}
                    width={16}
                    height={16}
                    className="object-contain"
                  />
                </div>
              ))}
              {connectedIntegrations.length > 3 && (
                <div className="relative w-5 h-5 rounded-full bg-[#1A1B1C] border border-[#3A3D3E] flex items-center justify-center text-xs text-gray-400">
                  +{connectedIntegrations.length - 3}
                </div>
              )}
            </span>
          )}
          <ChevronDown className={`h-3 w-3 transition-transform ${showIntegrations ? 'rotate-180' : ''}`} />
        </button>

        {/* Integrations Dropdown */}
        {showIntegrations && (
          <div className="absolute top-full mt-2 right-0 w-80 bg-[#2A2D2E] border border-[#3A3D3E] rounded-lg shadow-lg z-50">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-medium">Connected Data Sources</h3>
                <Link href="/app/integrations">
                  <button className="text-[#7B6EF6] hover:text-[#6A5ACD] text-sm transition-colors">
                    Manage
                  </button>
                </Link>
              </div>
              
              {hasConnections ? (
                <div className="space-y-2">
                  {connectedIntegrations.map((connection) => (
                    <div
                      key={connection.id}
                      className="flex items-center gap-3 p-2 rounded-md bg-[#1A1B1C]"
                    >
                      <div className="relative w-6 h-6 flex items-center justify-center">
                        <Image 
                          src={connection.iconUrl} 
                          alt={connection.name}
                          width={20}
                          height={20}
                          className="object-contain"
                        />
                      </div>
                      <span className="text-white text-sm flex-1">{connection.name}</span>
                      <div className={`w-2 h-2 rounded-full ${connection.enabled ? 'bg-green-500' : 'bg-gray-500'}`} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-400 text-sm mb-3">No data sources connected</p>
                  <Link href="/app/integrations">
                    <button className="px-4 py-2 bg-[#7B6EF6] hover:bg-[#6A5ACD] text-white text-sm rounded-md transition-colors">
                      Connect Data Sources
                    </button>
                  </Link>
                </div>
              )}
              
              <div className="mt-3 pt-3 border-t border-[#3A3D3E]">
                <p className="text-xs text-gray-500 text-center">
                  Connect your data sources to get AI insights across Ask, Research, and Agents
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}