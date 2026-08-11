import React from 'react';
import { Search, Filter, AlertCircle, Clock, CheckCircle, SlidersHorizontal, Pin } from 'lucide-react';
import { SortOption, StatusFilter } from '../types';

interface QuickStatsBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedStatus: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  totalCount: number;
  freshCount: number;
  dueSoonCount: number;
  overdueCount: number;
  categories: string[];
}

export const QuickStatsBar: React.FC<QuickStatsBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  sortBy,
  onSortChange,
  totalCount,
  freshCount,
  dueSoonCount,
  overdueCount,
  categories
}) => {
  return (
    <div className="space-y-4 mb-6">
      
      {/* Quick Summary Metric Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* All / Total */}
        <button
          onClick={() => onStatusChange('all')}
          id="stat-all-btn"
          className={`p-3.5 rounded-2xl border text-left transition-all duration-150 ${
            selectedStatus === 'all'
              ? 'bg-[#F2EFE9] border-[#AB70D5] ring-2 ring-[#AB70D5]/20 shadow-xs'
              : 'bg-white border-[#E8E4DE] hover:bg-[#FDFBF7] text-[#7A746D]'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-[#7A746D] mb-1">
            <span>Total Tasks</span>
            <Clock className="w-3.5 h-3.5 text-[#7A746D]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#2D2A26]">{totalCount}</div>
        </button>

        {/* Fresh */}
        <button
          onClick={() => onStatusChange('fresh')}
          id="stat-fresh-btn"
          className={`p-3.5 rounded-2xl border text-left transition-all duration-150 ${
            selectedStatus === 'fresh'
              ? 'bg-[#F4E9FA] border-[#AB70D5] ring-2 ring-[#AB70D5]/20 shadow-xs'
              : 'bg-white border-[#E8E4DE] hover:bg-[#FDFBF7] text-[#7A746D]'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-[#6B3B8A] mb-1">
            <span>Fresh & Good</span>
            <CheckCircle className="w-3.5 h-3.5 text-[#AB70D5]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#2D2A26]">{freshCount}</div>
        </button>

        {/* Due Soon */}
        <button
          onClick={() => onStatusChange('due-soon')}
          id="stat-due-soon-btn"
          className={`p-3.5 rounded-2xl border text-left transition-all duration-150 ${
            selectedStatus === 'due-soon'
              ? 'bg-[#FDF5E6] border-[#D4A373] ring-2 ring-[#D4A373]/20 shadow-xs'
              : 'bg-white border-[#E8E4DE] hover:bg-[#FDFBF7] text-[#7A746D]'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-[#D4A373] mb-1">
            <span>Due Soon</span>
            <Clock className="w-3.5 h-3.5 text-[#D4A373]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#2D2A26]">{dueSoonCount}</div>
        </button>

        {/* Overdue */}
        <button
          onClick={() => onStatusChange('overdue')}
          id="stat-overdue-btn"
          className={`p-3.5 rounded-2xl border text-left transition-all duration-150 ${
            selectedStatus === 'overdue'
              ? 'bg-[#FEE2E2] border-[#B91C1C]/40 ring-2 ring-[#B91C1C]/20 shadow-xs'
              : 'bg-white border-[#E8E4DE] hover:bg-[#FDFBF7] text-[#7A746D]'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-[#B91C1C] mb-1">
            <span>Overdue</span>
            <AlertCircle className="w-3.5 h-3.5 text-[#B91C1C]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#B91C1C]">{overdueCount}</div>
        </button>
      </div>

      {/* Search Input and Sort Selector */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
        {/* Search Field */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A948D] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks e.g. plants, oil..."
            id="search-tasks-input"
            className="w-full bg-white border border-[#E8E4DE] rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-[#2D2A26] placeholder-[#9A948D] focus:outline-none focus:border-[#AB70D5] focus:ring-1 focus:ring-[#AB70D5] transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A948D] hover:text-[#2D2A26] text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category & Sort controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {/* Category Dropdown */}
          <div className="relative min-w-[130px]">
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              id="category-select"
              className="w-full bg-white border border-[#E8E4DE] rounded-xl px-3 py-2 text-xs text-[#4A443F] font-semibold focus:outline-none focus:border-[#AB70D5] cursor-pointer shadow-2xs"
            >
              <option value="All">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="relative min-w-[150px]">
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              id="sort-select"
              className="w-full bg-white border border-[#E8E4DE] rounded-xl px-3 py-2 text-xs text-[#4A443F] font-semibold focus:outline-none focus:border-[#AB70D5] cursor-pointer shadow-2xs"
            >
              <option value="latest">Latest</option>
              <option value="earliest">Earliest</option>
              <option value="name">Name</option>
              <option value="custom">Custom Order</option>
            </select>
          </div>
        </div>
      </div>

    </div>
  );
};
