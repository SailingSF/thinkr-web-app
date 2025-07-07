import React from 'react';

interface TemplateCardProps {
  title: string;
  description: string;
  category: string;
  integrations: string[];
}

export default function TemplateCard({ title, description, category, integrations }: TemplateCardProps) {
  return (
    <div className="bg-[#1E2124] border border-[#2A2D31] rounded-lg p-6 h-72 flex flex-col justify-between hover:border-[#3A3D41] hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden">
      {/* Category Tag */}
      <div>
        <span className="inline-block px-3 py-1 bg-[#2A2D31] text-[#7B7B7B] text-sm rounded-full mb-4">
          {category}
        </span>
        {/* Title */}
        <h3 className="text-white text-lg font-medium mb-2 line-clamp-2">
          {title}
        </h3>
        {/* Description */}
        <p className="text-[#7B7B7B] text-sm mb-4 line-clamp-4">
          {description}
        </p>
      </div>
      {/* Footer with Integration Icons */}
      <div className="mt-auto">
        <div className="flex items-center gap-2">
          <span className="text-[#7B7B7B] text-xs mr-2">Integrations:</span>
          <div className="flex gap-2">
            {integrations.map((integration, index) => (
              <div
                key={index}
                className="w-6 h-6 bg-[#2A2D31] rounded-full flex items-center justify-center"
                title={integration}
              >
                <span className="text-[#7B7B7B] text-xs font-medium">
                  {integration.charAt(0).toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 