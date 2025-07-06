import React, { useState, ReactNode } from 'react';

interface Tab {
  label: string;
  content: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  initialTab?: number;
}

const Tabs: React.FC<TabsProps> = ({ tabs, initialTab = 0 }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div>
      <div className="flex border-b border-gray-700 mb-8 gap-8">
        {tabs.map((tab, idx) => (
          <button
            key={tab.label}
            className={`pb-2 text-lg font-medium transition-colors ${activeTab === idx ? 'text-white border-b-2 border-[#8C74FF]' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setActiveTab(idx)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{tabs[activeTab].content}</div>
    </div>
  );
};

export default Tabs; 