'use client';

import React, { useState } from 'react';

interface FilterSidebarProps {
  onCategoryChange?: (category: string | null) => void;
  onSortChange?: (sortType: 'popular' | 'recent') => void;
  selectedCategory?: string | null;
  currentSort?: 'popular' | 'recent';
}

export default function FilterSidebar({
  onCategoryChange,
  onSortChange,
  selectedCategory = null,
  currentSort = 'popular'
}: FilterSidebarProps) {
  // Handle category selection
  const handleCategoryClick = (category: string) => {
    if (onCategoryChange) {
      if (selectedCategory === category) {
        // If clicking the already selected category, clear the filter
        onCategoryChange(null);
      } else {
        // Otherwise, set the new category
        onCategoryChange(category);
      }
    }
  };

  // Handle sort selection
  const handleSortClick = (sortType: 'popular' | 'recent') => {
    if (onSortChange) {
      onSortChange(sortType);
    }
  };

  return (
    <div className="w-64 bg-[#1E1F20] rounded-lg p-5 text-white">
      {/* SORTED BY Section */}
      <div className="mb-8">
        <h3 className="text-sm text-gray-400 uppercase font-medium mb-4">SORTED BY</h3>
        
        <div className="flex flex-col space-y-3">
          <button 
            className={`text-white text-sm text-left py-2 transition-colors rounded-md px-3 ${
              currentSort === 'popular' ? 'bg-[#2C2D32]' : 'hover:bg-[#2C2D32]'
            }`}
            onClick={() => handleSortClick('popular')}
          >
            Most Popular
          </button>
          <button 
            className={`text-white text-sm text-left py-2 transition-colors rounded-md px-3 ${
              currentSort === 'recent' ? 'bg-[#2C2D32]' : 'hover:bg-[#2C2D32]'
            }`}
            onClick={() => handleSortClick('recent')}
          >
            Recently Added
          </button>
        </div>
      </div>

      {/* CATEGORIES Section */}
      <div className="mb-4">
        <h3 className="text-sm text-gray-400 uppercase font-medium mb-4">CATEGORIES</h3>
        
        <div className="flex flex-col space-y-3">
          <button 
            className={`text-white text-sm text-left py-2 transition-colors rounded-md px-3 ${
              selectedCategory === 'Inventory' ? 'bg-[#2C2D32]' : 'hover:bg-[#2C2D32]'
            }`}
            onClick={() => handleCategoryClick('Inventory')}
          >
            Inventory
          </button>
          <button 
            className={`text-white text-sm text-left py-2 transition-colors rounded-md px-3 ${
              selectedCategory === 'Marketing' ? 'bg-[#2C2D32]' : 'hover:bg-[#2C2D32]'
            }`}
            onClick={() => handleCategoryClick('Marketing')}
          >
            Marketing
          </button>
          <button 
            className={`text-white text-sm text-left py-2 transition-colors rounded-md px-3 ${
              selectedCategory === 'Finance' ? 'bg-[#2C2D32]' : 'hover:bg-[#2C2D32]'
            }`}
            onClick={() => handleCategoryClick('Finance')}
          >
            Finance
          </button>
          <button 
            className={`text-white text-sm text-left py-2 transition-colors rounded-md px-3 ${
              selectedCategory === 'Customer Service' ? 'bg-[#2C2D32]' : 'hover:bg-[#2C2D32]'
            }`}
            onClick={() => handleCategoryClick('Customer Service')}
          >
            Customer Service
          </button>
        </div>
      </div>
    </div>
  );
} 