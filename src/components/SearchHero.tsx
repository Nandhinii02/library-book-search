import React, { useState } from 'react';
import { Search, X, SlidersHorizontal, Sparkles, Filter, Check, RotateCcw, LayoutGrid, List } from 'lucide-react';
import { SearchFilters } from '../types/book';

interface SearchHeroProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSearch: (overrideQuery?: string) => void;
  filters: SearchFilters;
  setFilters: React.Dispatch<React.SetStateAction<SearchFilters>>;
  onResetFilters: () => void;
  layout: 'grid' | 'list';
  setLayout: (layout: 'grid' | 'list') => void;
  totalResults: number;
  isLoading: boolean;
  searchMode?: string;
  executionTimeMs?: number;
}

const EXAMPLE_QUERIES = [
  'Find beginner-friendly Python programming books',
  'Show me books about artificial intelligence published after 2020',
  'Find novels similar to Harry Potter',
  'Recommend books for learning data structures and algorithms',
  'Books on quantum physics and cosmology',
  'Dystopian novels on totalitarianism and surveillance',
];

const GENRES = [
  'All',
  'Computer Science',
  'Artificial Intelligence',
  'Science',
  'Literature & Fiction',
  'History',
  'Self-Development',
  'Business',
  'Business & Psychology',
];

const READING_LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced', 'All Levels'];

export const SearchHero: React.FC<SearchHeroProps> = ({
  searchQuery,
  setSearchQuery,
  onSearch,
  filters,
  setFilters,
  onResetFilters,
  layout,
  setLayout,
  totalResults,
  isLoading,
  searchMode,
  executionTimeMs,
}) => {
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  const handleSuggestionClick = (query: string) => {
    setSearchQuery(query);
    onSearch(query);
  };

  const activeFilterCount = [
    filters.genre && filters.genre !== 'All',
    filters.readingLevel && filters.readingLevel !== 'All',
    filters.availableOnly,
    filters.yearMin !== undefined,
    filters.language && filters.language !== 'All',
  ].filter(Boolean).length;

  return (
    <div className="relative pt-8 pb-6 px-4 sm:px-6 lg:px-8">
      {/* Hero Header */}
      <div className="max-w-4xl mx-auto text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-800 text-xs font-semibold mb-3 border border-amber-500/20">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Retrieval-Augmented Generation &bull; Semantic Vector Search</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif-title font-bold text-slate-900 tracking-tight mb-3">
          Discover Your Next Great Read
        </h1>

        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Ask questions in natural language, explore library holdings with semantic search,
          and receive grounded recommendations verified against our catalog.
        </p>
      </div>

      {/* Main Search Input */}
      <div className="max-w-3xl mx-auto mb-4">
        <form onSubmit={handleSubmit} className="relative flex items-center shadow-lg rounded-2xl bg-white border-2 border-slate-200 focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-500/10 transition-all">
          <div className="pl-4 text-slate-400">
            <Search className="w-5 h-5 text-amber-600" />
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by topic, question, title, author, genre, or ISBN (e.g. 'clean architecture for beginners')..."
            className="w-full py-4 pl-3 pr-28 text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent"
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                onSearch('');
              }}
              className="p-1.5 mr-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="pr-2 flex items-center gap-1.5">
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-amber-600 text-white text-xs sm:text-sm font-semibold transition-all shadow active:scale-95 flex items-center gap-1.5"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <span>Search</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Example Suggestion Pills */}
      <div className="max-w-3xl mx-auto mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
          <span className="text-slate-400 font-semibold flex-shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Try:
          </span>
          {EXAMPLE_QUERIES.map((query, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(query)}
              className="flex-shrink-0 px-3 py-1 rounded-full bg-slate-100 hover:bg-amber-100 hover:text-amber-900 hover:border-amber-300 text-slate-600 border border-slate-200 transition-colors text-[11px]"
            >
              &ldquo;{query}&rdquo;
            </button>
          ))}
        </div>
      </div>

      {/* Controls Bar: Filters Toggle, Sort, Layout */}
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              showFilterDrawer || activeFilterCount > 0
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950 text-white font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={onResetFilters}
              className="px-2.5 py-1.5 rounded-xl text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}

          {/* Quick Available Only Toggle */}
          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer ml-2 select-none">
            <input
              type="checkbox"
              checked={filters.availableOnly || false}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, availableOnly: e.target.checked }));
                setTimeout(() => onSearch(), 50);
              }}
              className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
            />
            <span>Available in library now</span>
          </label>
        </div>

        {/* Right side: Results info, sorting, view switch */}
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-500">
            <span className="font-semibold text-slate-800">{totalResults}</span> books
            {executionTimeMs !== undefined && (
              <span className="hidden sm:inline text-slate-400 ml-1.5">
                ({executionTimeMs}ms • {searchMode || 'RAG Hybrid'})
              </span>
            )}
          </div>

          {/* Sorting */}
          <select
            value={filters.sortBy || 'relevance'}
            onChange={(e) => {
              setFilters(prev => ({ ...prev, sortBy: e.target.value as any }));
              setTimeout(() => onSearch(), 50);
            }}
            className="text-xs py-1.5 px-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 focus:outline-none focus:border-amber-500"
          >
            <option value="relevance">Sort: Relevance</option>
            <option value="rating">Sort: Highest Rating</option>
            <option value="year">Sort: Publication Year</option>
            <option value="title">Sort: Title (A-Z)</option>
          </select>

          {/* Grid vs List toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setLayout('grid')}
              className={`p-1 rounded-lg transition-colors ${layout === 'grid' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLayout('list')}
              className={`p-1 rounded-lg transition-colors ${layout === 'list' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Filter Drawer */}
      {showFilterDrawer && (
        <div className="max-w-6xl mx-auto mt-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-md animate-in slide-in-from-top-2 duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Genre */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Genre / Category
              </label>
              <select
                value={filters.genre || 'All'}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, genre: e.target.value }));
                  setTimeout(() => onSearch(), 50);
                }}
                className="w-full text-xs py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-amber-500"
              >
                {GENRES.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* Reading Level */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Reading Level
              </label>
              <select
                value={filters.readingLevel || 'All'}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, readingLevel: e.target.value }));
                  setTimeout(() => onSearch(), 50);
                }}
                className="w-full text-xs py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-amber-500"
              >
                {READING_LEVELS.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            {/* Publication Year Range */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Published After (Year)
              </label>
              <input
                type="number"
                placeholder="e.g. 2020"
                min="1900"
                max="2030"
                value={filters.yearMin || ''}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : undefined;
                  setFilters(prev => ({ ...prev, yearMin: val }));
                  setTimeout(() => onSearch(), 100);
                }}
                className="w-full text-xs py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Language */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Language
              </label>
              <select
                value={filters.language || 'All'}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, language: e.target.value }));
                  setTimeout(() => onSearch(), 50);
                }}
                className="w-full text-xs py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-amber-500"
              >
                <option value="All">All Languages</option>
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
