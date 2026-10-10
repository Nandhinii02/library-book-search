import React, { useState, useEffect } from 'react';
import { Book, SearchFilters, SearchResult } from './types/book';
import { fetchBooks, searchBooks } from './services/api';
import { Navbar } from './components/Navbar';
import { SearchHero } from './components/SearchHero';
import { BookCard } from './components/BookCard';
import { BookDetailModal } from './components/BookDetailModal';
import { RecommendationsView } from './components/RecommendationsView';
import { ChatAssistantView } from './components/ChatAssistantView';
import { FavoritesView } from './components/FavoritesView';
import { AdminDashboard } from './components/AdminDashboard';
import { FloatingChatDrawer } from './components/FloatingChatDrawer';
import { BookOpen, Sparkles, AlertCircle, ChevronLeft, ChevronRight, Layers, ShieldCheck, Heart } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'search' | 'recommendations' | 'chat' | 'favorites' | 'admin'>('search');
  
  // Catalog & Search State
  const [books, setBooks] = useState<Book[]>([]);
  const [totalBooks, setTotalBooks] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    genre: 'All',
    readingLevel: 'All',
    language: 'All',
    availableOnly: false,
    sortBy: 'relevance',
    page: 1,
    limit: 12,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [searchMode, setSearchMode] = useState<string>('hybrid');
  const [executionTimeMs, setExecutionTimeMs] = useState<number | undefined>(undefined);
  const [scoresMap, setScoresMap] = useState<Record<string, number>>({});
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');

  // Favorites / Reading list state
  const [favorites, setFavorites] = useState<Book[]>(() => {
    const saved = localStorage.getItem('library_favorites');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return [];
  });

  // Selected book for detail modal
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // Target book for similar recommendation redirect
  const [targetBookForSimilar, setTargetBookForSimilar] = useState<Book | null>(null);

  // Sync favorites to localStorage
  useEffect(() => {
    localStorage.setItem('library_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Execute Search / Fetch
  const handlePerformSearch = async (overrideQuery?: string) => {
    const q = overrideQuery !== undefined ? overrideQuery : searchQuery;
    setIsLoading(true);

    try {
      if (q && q.trim().length > 0) {
        // Use RAG Search endpoint
        const res = await searchBooks(q, filters, 18);
        setBooks(res.books);
        setTotalBooks(res.total);
        setSearchMode(res.mode);
        setExecutionTimeMs(res.executionTimeMs);

        const sMap: Record<string, number> = {};
        if (res.scores) {
          res.scores.forEach(s => {
            sMap[s.bookId] = s.score;
          });
        }
        setScoresMap(sMap);
      } else {
        // Use standard filtered catalog endpoint
        const res = await fetchBooks(filters);
        setBooks(res.books);
        setTotalBooks(res.total);
        setSearchMode('keyword');
        setExecutionTimeMs(undefined);
        setScoresMap({});
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handlePerformSearch();
  }, [filters.page, filters.sortBy]);

  // Reset Filters
  const handleResetFilters = () => {
    setFilters({
      genre: 'All',
      readingLevel: 'All',
      language: 'All',
      availableOnly: false,
      sortBy: 'relevance',
      page: 1,
      limit: 12,
    });
    setSearchQuery('');
    setTimeout(() => {
      fetchBooks({ page: 1, limit: 12 }).then(res => {
        setBooks(res.books);
        setTotalBooks(res.total);
        setScoresMap({});
      });
    }, 50);
  };

  // Toggle Favorite
  const handleToggleFavorite = (book: Book) => {
    setFavorites(prev => {
      const exists = prev.some(b => b.id === book.id);
      if (exists) {
        return prev.filter(b => b.id !== book.id);
      } else {
        return [...prev, book];
      }
    });
  };

  // Find Similar Books
  const handleFindSimilar = (book: Book) => {
    setTargetBookForSimilar(book);
    setActiveTab('recommendations');
  };

  // On Book updated via Modal borrow/return
  const handleBookUpdated = (updated: Book) => {
    setSelectedBook(updated);
    setBooks(prev => prev.map(b => b.id === updated.id ? updated : b));
    setFavorites(prev => prev.map(b => b.id === updated.id ? updated : b));
  };

  const totalPages = Math.ceil(totalBooks / (filters.limit || 12)) || 1;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-amber-500 selection:text-slate-950">
      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        favoritesCount={favorites.length}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* TAB 1: Search & Catalog */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            <SearchHero
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onSearch={handlePerformSearch}
              filters={filters}
              setFilters={setFilters}
              onResetFilters={handleResetFilters}
              layout={layout}
              setLayout={setLayout}
              totalResults={totalBooks}
              isLoading={isLoading}
              searchMode={searchMode}
              executionTimeMs={executionTimeMs}
            />

            {/* Catalog Book List */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
              {isLoading ? (
                <div className="py-24 text-center">
                  <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-sm font-medium text-slate-600">
                    Retrieving catalog documents and ranking by semantic relevance...
                  </p>
                </div>
              ) : books.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8 max-w-lg mx-auto shadow-sm">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-100">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <h3 className="font-serif-title font-bold text-xl text-slate-900 mb-2">
                    No Matching Books Found
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
                    No books in our collection match &ldquo;{searchQuery}&rdquo; with the current filter criteria.
                    Try using broader keywords or clearing specific constraints.
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow"
                  >
                    Reset Search &amp; Filters
                  </button>
                </div>
              ) : (
                <>
                  <div className={
                    layout === 'grid'
                      ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'
                      : 'space-y-3'
                  }>
                    {books.map((book) => (
                      <BookCard
                        key={book.id}
                        book={book}
                        onSelect={setSelectedBook}
                        onToggleFavorite={handleToggleFavorite}
                        isFavorite={favorites.some(f => f.id === book.id)}
                        onFindSimilar={handleFindSimilar}
                        layout={layout}
                        score={scoresMap[book.id]}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && !searchQuery && (
                    <div className="mt-10 flex items-center justify-center gap-2">
                      <button
                        onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, (prev.page || 1) - 1) }))}
                        disabled={(filters.page || 1) <= 1}
                        className="p-2 rounded-xl border border-slate-300 disabled:opacity-40 hover:bg-slate-100 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <span className="text-xs font-medium text-slate-600 px-3">
                        Page {filters.page || 1} of {totalPages}
                      </span>

                      <button
                        onClick={() => setFilters(prev => ({ ...prev, page: Math.min(totalPages, (prev.page || 1) + 1) }))}
                        disabled={(filters.page || 1) >= totalPages}
                        className="p-2 rounded-xl border border-slate-300 disabled:opacity-40 hover:bg-slate-100 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: AI Recommendations */}
        {activeTab === 'recommendations' && (
          <RecommendationsView
            onSelectBook={setSelectedBook}
            onToggleFavorite={handleToggleFavorite}
            favorites={favorites}
            targetBookForSimilar={targetBookForSimilar}
            onClearTargetBook={() => setTargetBookForSimilar(null)}
          />
        )}

        {/* TAB 3: Conversational Library Assistant */}
        {activeTab === 'chat' && (
          <ChatAssistantView
            onSelectBook={setSelectedBook}
            onToggleFavorite={handleToggleFavorite}
            favorites={favorites}
          />
        )}

        {/* TAB 4: Reading List / Favorites */}
        {activeTab === 'favorites' && (
          <FavoritesView
            favorites={favorites}
            onSelectBook={setSelectedBook}
            onRemoveFavorite={handleToggleFavorite}
            onClearFavorites={() => setFavorites([])}
            onNavigateToSearch={() => setActiveTab('search')}
          />
        )}

        {/* TAB 5: Staff Admin Dashboard */}
        {activeTab === 'admin' && (
          <AdminDashboard
            books={books}
            onRefreshCatalog={handlePerformSearch}
            onSelectBook={setSelectedBook}
          />
        )}
      </main>

      {/* Book Detail Modal */}
      <BookDetailModal
        book={selectedBook}
        onClose={() => setSelectedBook(null)}
        onToggleFavorite={handleToggleFavorite}
        isFavorite={selectedBook ? favorites.some(f => f.id === selectedBook.id) : false}
        onFindSimilar={handleFindSimilar}
        onBookUpdated={handleBookUpdated}
      />

      {/* Persistent Floating Chat Assistant Drawer (available across tabs except full chat) */}
      {activeTab !== 'chat' && (
        <FloatingChatDrawer onSelectBook={setSelectedBook} />
      )}

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-8 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-500" />
            <span className="font-serif-title text-slate-200 font-bold tracking-wider">Smart Library AI</span>
            <span>&bull;</span>
            <span>RAG-Powered Book Search &amp; Recommendation Engine</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Powered by Gemini &amp; Vector Embeddings</span>
            <span>&bull;</span>
            <button
              onClick={() => setActiveTab('admin')}
              className="hover:text-amber-400 transition-colors"
            >
              Staff Portal
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
