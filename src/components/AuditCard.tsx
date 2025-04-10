import React from 'react';

interface AuditCardProps {
  onTriggerAudit: () => void;
  isLoading: boolean;
}

const AuditCard = ({ onTriggerAudit, isLoading }: AuditCardProps) => {
  return (
    <div className="bg-[#2C2C2E] p-6 lg:p-8 rounded-lg">
      <div className="mb-6 lg:mb-8">
        <p className="text-[#8B5CF6] text-base lg:text-lg mb-2">Step 1:</p>
        <h3 className="text-[32px] font-inter font-normal text-white">Generate Initial Store Audit</h3>
        <p className="text-sm lg:text-base text-gray-400 mt-2">
          Get a baseline analysis of your store's marketing performance. We'll email the report to you.
        </p>
      </div>

      <div className="space-y-4 lg:space-y-6">
        <button
          onClick={onTriggerAudit}
          disabled={isLoading}
          className={`inline-block w-full px-4 lg:px-6 py-3 lg:py-4 text-center text-white font-medium rounded-md transition-colors ${
            isLoading
              ? 'bg-[#6D28D9] opacity-75 cursor-wait'
              : 'bg-[#8B5CF6] hover:bg-[#7C3AED]'
          }`}
        >
          {isLoading ? 'Generating Audit...' : 'Start Store Audit'}
        </button>
      </div>
    </div>
  );
};

export default AuditCard; 