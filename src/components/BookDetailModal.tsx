import React, { useState } from 'react';
import { Book } from '../types/book';
import { X, MapPin, Bookmark, Sparkles, Star, BookOpen, Layers, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

interface BookDetailModalProps {
  book: Book | null;
  onClose: () => void;
  onToggleFavorite: (book: Book) => void;
  isFavorite: boolean;
  onFindSimilar: (book: Book) => void;
  onBookUpdated?: (updatedBook: Book) => void;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  book,
  onClose,
  onToggleFavorite,
  isFavorite,
  onFindSimilar,
  onBookUpdated,
}) => {
  const [borrowLoading, setBorrowLoading] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  if (!book) return null;

  const isAvailable = book.available && book.availableCopies > 0;

  // Simulate borrow / return
  const handleToggleBorrow = async () => {
    setBorrowLoading(true);
    setActionSuccessMessage(null);
    try {
      const newAvailableCopies = isAvailable ? Math.max(0, book.availableCopies - 1) : Math.min(book.totalCopies, book.availableCopies + 1);
      const newAvailable = newAvailableCopies > 0;

      const res = await fetch(`/api/admin/books/${book.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'admin123',
        },
        body: JSON.stringify({
          availableCopies: newAvailableCopies,
          available: newAvailable,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.book && onBookUpdated) {
          onBookUpdated(data.book);
        }
        setActionSuccessMessage(
          isAvailable
            ? `Successfully checked out 1 copy of "${book.title}". Due back in 21 days.`
            : `Returned copy of "${book.title}". Now available for borrowers!`
        );
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setBorrowLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-900/50 hover:bg-slate-900 text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header / Hero */}
        <div className="relative h-64 bg-slate-900 overflow-hidden flex items-end p-6">
          <img
            src={book.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'}
            alt={book.title}
            className="absolute inset-0 w-full h-full object-cover opacity-35 blur-[2px] scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent"></div>

          <div className="relative z-10 flex gap-5 items-end w-full">
            <div className="w-24 h-36 sm:w-28 sm:h-40 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 flex-shrink-0 bg-slate-800">
              <img
                src={book.coverImage}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 min-w-0 text-white pb-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {book.category}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700">
                  {book.readingLevel}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {book.publicationYear}
                </span>
              </div>

              <h2 className="font-serif-title text-xl sm:text-2xl font-bold line-clamp-2 text-white">
                {book.title}
              </h2>
              <p className="text-sm text-amber-200/90 font-medium">
                by {book.author}
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Success Message Banner */}
          {actionSuccessMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{actionSuccessMessage}</span>
            </div>
          )}

          {/* Shelf Call Number & Availability Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-800 flex-shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
                  Library Shelf Location
                </span>
                <p className="text-sm font-bold font-mono-code text-slate-900 mt-0.5">
                  {book.shelfLocation}
                </p>
                <p className="text-xs text-slate-500">Stacks Section • Main Library</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl flex-shrink-0 ${isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {isAvailable ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
                  Catalog Availability
                </span>
                <p className={`text-sm font-bold mt-0.5 ${isAvailable ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {isAvailable
                    ? `Available (${book.availableCopies} of ${book.totalCopies} copies in library)`
                    : `Currently Checked Out (0 of ${book.totalCopies} available)`}
                </p>
                <p className="text-xs text-slate-500">
                  {isAvailable ? 'Immediate loan available' : 'Hold reservation required'}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-sans">
              About This Book
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed">
              {book.description}
            </p>
          </div>

          {/* Metadata Grid */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-sans">
              Bibliographic Details
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block mb-0.5">ISBN</span>
                <span className="font-mono-code font-semibold text-slate-800 select-all">{book.isbn}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Language</span>
                <span className="font-semibold text-slate-800">{book.language}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Length</span>
                <span className="font-semibold text-slate-800">{book.pages || 'N/A'} pages</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Publisher</span>
                <span className="font-semibold text-slate-800 line-clamp-1">{book.publisher || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          {book.tags && book.tags.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-sans">
                Catalog Subject Keywords
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {book.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200/60"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-5 border-t border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(book)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                isFavorite
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-slate-950' : ''}`} />
              <span>{isFavorite ? 'Saved in Reading List' : 'Save to List'}</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onFindSimilar(book);
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-white text-slate-700 border border-slate-300 hover:border-amber-400 hover:text-amber-700 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Find Similar Books</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleBorrow}
              disabled={borrowLoading}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-all ${
                isAvailable
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>
                {borrowLoading
                  ? 'Processing...'
                  : isAvailable
                  ? 'Simulate Borrow (Check Out)'
                  : 'Simulate Return (Check In)'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
