'use client';

import Image from 'next/image';

export interface Connection {
  id: string;
  name: string;
  iconUrl: string;
  enabled: boolean;
}

interface ConnectionsBarProps {
  connections: Connection[];
}

const ConnectionsBar: React.FC<ConnectionsBarProps> = ({ connections }) => {
  if (!connections || connections.length === 0) {
    return null; // Or some placeholder if needed
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {connections.map((connection) => (
        <div
          key={connection.id}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
            ${connection.enabled ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400'}`}
        >
          {connection.enabled && (
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          )}
          {!connection.enabled && (
            <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
          )}
          {connection.iconUrl && (
            <div className="relative w-4 h-4">
              <Image src={connection.iconUrl} alt={`${connection.name} icon`} fill style={{ objectFit: 'contain' }} />
            </div>
          )}
          <span>{connection.name}</span>
        </div>
      ))}
    </div>
  );
};

export default ConnectionsBar; 