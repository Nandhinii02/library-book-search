import React from 'react';
import { BookOpen, Sparkles, MessageSquare, Bookmark, ShieldCheck, Cpu } from 'lucide-react';

interface NavbarProps {
  activeTab: 'search' | 'recommendations' | 'chat' | 'favorites' | 'admin';
  setActiveTab: (tab: 'search' | 'recommendations' | 'chat' | 'favorites' | 'admin') => void;
  favoritesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, favoritesCount }) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div 
            onClick={() => setActiveTab('search')}
            className="flex items-center space-x-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-emerald-500 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif-title tracking-wider text-lg font-bold text-white">SMART LIBRARY</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  RAG AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans tracking-tight">Intelligent Catalog &amp; Recommendation Agent</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <button
              onClick={() => setActiveTab('search')}
              className={`px-3 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'search'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Catalog &amp; Search</span>
            </button>

            <button
              onClick={() => setActiveTab('recommendations')}
              className={`px-3 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'recommendations'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>AI Recommendations</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'chat'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>Ask Library AI</span>
            </button>

            <button
              onClick={() => setActiveTab('favorites')}
              className={`px-3 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all flex items-center gap-1.5 relative ${
                activeTab === 'favorites'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>Reading List</span>
              {favoritesCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[11px] font-bold bg-amber-500 text-slate-950">
                  {favoritesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Staff Portal</span>
            </button>
          </nav>

          {/* Quick RAG Badge & Mobile Menu Toggles */}
          <div className="flex items-center space-x-2">
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300">
              <Cpu className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>RAG Engine Active</span>
            </div>

            {/* Mobile Bottom bar / icons */}
            <div className="flex md:hidden items-center gap-1">
              <button
                onClick={() => setActiveTab('search')}
                className={`p-2 rounded-lg ${activeTab === 'search' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-300'}`}
                title="Search"
              >
                <BookOpen className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveTab('recommendations')}
                className={`p-2 rounded-lg ${activeTab === 'recommendations' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-300'}`}
                title="Recommendations"
              >
                <Sparkles className="w-5 h-5 text-amber-400" />
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`p-2 rounded-lg ${activeTab === 'chat' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-300'}`}
                title="Chat"
              >
                <MessageSquare className="w-5 h-5 text-emerald-400" />
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className={`p-2 rounded-lg relative ${activeTab === 'favorites' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-300'}`}
                title="Favorites"
              >
                <Bookmark className="w-5 h-5" />
                {favoritesCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500"></span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('admin')}
                className={`p-2 rounded-lg ${activeTab === 'admin' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-300'}`}
                title="Admin"
              >
                <ShieldCheck className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
