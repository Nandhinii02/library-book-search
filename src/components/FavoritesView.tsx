import React, { useState } from 'react';
import { Book } from '../types/book';
import { Bookmark, Download, Trash2, BookOpen, Star, MapPin, CheckCircle2, AlertCircle, Share2, Check } from 'lucide-react';

interface FavoritesViewProps {
  favorites: Book[];
  onSelectBook: (book: Book) => void;
  onRemoveFavorite: (book: Book) => void;
  onClearFavorites: () => void;
  onNavigateToSearch: () => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  favorites,
  onSelectBook,
  onRemoveFavorite,
  onClearFavorites,
  onNavigateToSearch,
}) => {
  const [copied, setCopied] = useState(false);

  const handleExportText = () => {
    const lines = [
      '# My Smart Library Reading List',
      `Exported on: ${new Date().toLocaleDateString()}`,
      `Total Books: ${favorites.length}`,
      '',
      ...favorites.map((b, i) => `${i + 1}. **${b.title}** by ${b.author} (${b.publicationYear})
   - Call Number: ${b.shelfLocation}
   - ISBN: ${b.isbn}
   - Status: ${b.available ? `Available (${b.availableCopies} copies in library)` : 'Checked Out'}
   - Description: ${b.description}`),
    ].join('\n\n');

    navigator.clipboard.writeText(lines);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(favorites, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'my_reading_list.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-800 text-xs font-semibold mb-2 border border-amber-500/20">
            <Bookmark className="w-3.5 h-3.5 text-amber-600" />
            <span>Personal Library Shelf</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif-title font-bold text-slate-900">
            My Reading List &amp; Saved Books
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Keep track of titles you want to read, borrow, or reference later.
          </p>
        </div>

        {favorites.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportText}
              className="px-3 py-2 rounded-xl bg-white border border-slate-300 hover:border-amber-500 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4 text-slate-500" />}
              <span>{copied ? 'Copied List!' : 'Copy as Text'}</span>
            </button>

            <button
              onClick={handleExportJson}
              className="px-3 py-2 rounded-xl bg-white border border-slate-300 hover:border-amber-500 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export JSON</span>
            </button>

            <button
              onClick={onClearFavorites}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Clear all saved books"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {favorites.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8 max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-100">
            <Bookmark className="w-8 h-8" />
          </div>
          <h3 className="font-serif-title font-bold text-xl text-slate-900 mb-2">
            Your Reading List is Empty
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
            Click the bookmark icon on any book card in the catalog or recommendations to save titles here.
          </p>
          <button
            onClick={onNavigateToSearch}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow"
          >
            Explore Library Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((book) => {
            const isAvailable = book.available && book.availableCopies > 0;
            return (
              <div
                key={book.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-amber-400 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex gap-4 items-start mb-3">
                    <div 
                      onClick={() => onSelectBook(book)}
                      className="w-16 h-24 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 cursor-pointer shadow-sm relative"
                    >
                      <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {book.category}
                        </span>
                        <button
                          onClick={() => onRemoveFavorite(book)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Remove from list"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h4
                        onClick={() => onSelectBook(book)}
                        className="font-serif-title font-bold text-sm text-slate-900 group-hover:text-amber-700 cursor-pointer transition-colors line-clamp-1"
                      >
                        {book.title}
                      </h4>
                      <p className="text-xs text-slate-600 mb-1">
                        by {book.author} ({book.publicationYear})
                      </p>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono-code">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span className="truncate">{book.shelfLocation}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                    {book.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    {isAvailable ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        In Library ({book.availableCopies} available)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        Checked Out
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onSelectBook(book)}
                    className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-amber-600 text-white text-xs font-semibold transition-colors"
                  >
                    View
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
