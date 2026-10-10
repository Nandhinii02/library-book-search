import React from 'react';
import { Book } from '../types/book';
import { Bookmark, Star, MapPin, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

interface BookCardProps {
  book: Book;
  onSelect: (book: Book) => void;
  onToggleFavorite: (book: Book) => void;
  isFavorite: boolean;
  onFindSimilar?: (book: Book) => void;
  layout?: 'grid' | 'list';
  score?: number;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onSelect,
  onToggleFavorite,
  isFavorite,
  onFindSimilar,
  layout = 'grid',
  score,
}) => {
  const isAvailable = book.available && book.availableCopies > 0;

  if (layout === 'list') {
    return (
      <div className="bg-white border border-slate-200 hover:border-amber-400 rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-4 items-start md:items-center justify-between group">
        <div className="flex items-start gap-4 flex-1">
          {/* Cover thumbnail */}
          <div 
            onClick={() => onSelect(book)}
            className="w-16 h-24 sm:w-20 sm:h-28 flex-shrink-0 bg-slate-100 rounded-lg overflow-hidden relative shadow-inner cursor-pointer"
          >
            <img
              src={book.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=300&q=80'}
              alt={book.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            {score !== undefined && (
              <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950 shadow">
                {Math.round(score * 100)}% Match
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-100 text-slate-700">
                {book.category}
              </span>
              <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-indigo-50 text-indigo-700">
                {book.readingLevel}
              </span>
              <span className="text-xs text-slate-400">
                {book.publicationYear}
              </span>
              {book.rating && (
                <span className="flex items-center text-xs font-semibold text-amber-600 gap-0.5">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  {book.rating}
                </span>
              )}
            </div>

            <h3 
              onClick={() => onSelect(book)}
              className="font-serif-title font-bold text-base text-slate-900 hover:text-amber-700 cursor-pointer transition-colors line-clamp-1"
            >
              {book.title}
            </h3>
            <p className="text-xs text-slate-600 font-medium mb-1.5">
              by <span className="text-slate-800">{book.author}</span>
            </p>

            <p className="text-xs text-slate-500 line-clamp-2 mb-2 leading-relaxed">
              {book.description}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-mono-code">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {book.shelfLocation}
              </span>
              <span>ISBN: {book.isbn}</span>
            </div>
          </div>
        </div>

        {/* Right Status & Actions */}
        <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
          <div className="flex items-center gap-1.5">
            {isAvailable ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Available ({book.availableCopies}/{book.totalCopies})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                Checked Out (0/{book.totalCopies})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onFindSimilar && (
              <button
                onClick={() => onFindSimilar(book)}
                title="Find similar books"
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-amber-500 text-xs font-medium text-slate-700 hover:text-amber-800 flex items-center gap-1 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">Similar</span>
              </button>
            )}

            <button
              onClick={() => onToggleFavorite(book)}
              title={isFavorite ? 'Remove from reading list' : 'Save to reading list'}
              className={`p-1.5 rounded-lg border transition-colors ${
                isFavorite
                  ? 'bg-amber-50 border-amber-300 text-amber-600'
                  : 'border-slate-200 hover:border-slate-300 text-slate-400 hover:text-slate-600'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-amber-500' : ''}`} />
            </button>

            <button
              onClick={() => onSelect(book)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-amber-600 text-white text-xs font-medium transition-colors shadow-sm"
            >
              Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Grid layout
  return (
    <div className="bg-white border border-slate-200 hover:border-amber-400 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col h-full group">
      {/* Book Cover Header */}
      <div 
        onClick={() => onSelect(book)}
        className="relative h-48 bg-slate-100 overflow-hidden cursor-pointer"
      >
        <img
          src={book.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'}
          alt={book.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>

        {/* Favorite Bookmark */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(book);
          }}
          className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md shadow transition-transform active:scale-95 ${
            isFavorite
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'bg-slate-900/60 hover:bg-slate-900 text-white'
          }`}
          title={isFavorite ? 'Saved to Reading List' : 'Save Book'}
        >
          <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-slate-950' : ''}`} />
        </button>

        {/* Semantic Score Badge */}
        {score !== undefined && (
          <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md backdrop-blur-md bg-amber-500/90 text-slate-950 text-xs font-bold shadow flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>{Math.round(score * 100)}% Match</span>
          </div>
        )}

        {/* Shelf location indicator at bottom of cover */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] text-slate-200 font-mono-code">
          <span className="flex items-center gap-1 drop-shadow">
            <MapPin className="w-3 h-3 text-amber-400" />
            {book.shelfLocation}
          </span>
          {book.rating && (
            <span className="flex items-center gap-0.5 font-bold text-amber-300 drop-shadow">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {book.rating}
            </span>
          )}
        </div>
      </div>

      {/* Book Information Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase rounded-md bg-slate-100 text-slate-700">
              {book.category}
            </span>
            <span className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-indigo-50 text-indigo-700">
              {book.readingLevel}
            </span>
            <span className="text-[11px] text-slate-400 font-medium ml-auto">
              {book.publicationYear}
            </span>
          </div>

          <h3 
            onClick={() => onSelect(book)}
            className="font-serif-title font-bold text-base text-slate-900 group-hover:text-amber-700 transition-colors cursor-pointer line-clamp-1 mb-1"
          >
            {book.title}
          </h3>

          <p className="text-xs text-slate-600 font-medium mb-2">
            by <span className="text-slate-800">{book.author}</span>
          </p>

          <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-3">
            {book.description}
          </p>
        </div>

        {/* Footer: Availability & Action */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          {/* Availability pill */}
          <div>
            {isAvailable ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Available ({book.availableCopies}/{book.totalCopies})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                <AlertCircle className="w-3 h-3 text-rose-600" />
                Checked Out (0/{book.totalCopies})
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {onFindSimilar && (
              <button
                onClick={() => onFindSimilar(book)}
                title="Recommend similar books"
                className="p-1.5 rounded-lg border border-slate-200 hover:border-amber-400 text-slate-600 hover:text-amber-700 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              </button>
            )}

            <button
              onClick={() => onSelect(book)}
              className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-amber-600 text-white text-xs font-semibold transition-colors"
            >
              View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
