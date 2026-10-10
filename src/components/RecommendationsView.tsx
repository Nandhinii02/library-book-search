import React, { useState, useEffect } from 'react';
import { Book, RecommendationItem, RecommendationRequest } from '../types/book';
import { getRecommendations } from '../services/api';
import { Sparkles, ThumbsUp, Bookmark, X, Star, MapPin, CheckCircle2, AlertCircle, RefreshCw, Sliders, Info, ShieldAlert } from 'lucide-react';

interface RecommendationsViewProps {
  onSelectBook: (book: Book) => void;
  onToggleFavorite: (book: Book) => void;
  favorites: Book[];
  targetBookForSimilar?: Book | null;
  onClearTargetBook?: () => void;
}

const POPULAR_INTERESTS = [
  'Python',
  'Deep Learning',
  'Algorithms',
  'Distributed Systems',
  'Clean Architecture',
  'Astronomy & Space',
  'Sci-Fi Adventure',
  'Evolutionary Biology',
  'Habit Formation',
  'Cognitive Psychology',
  'Tech History',
  'Dystopian Fiction',
];

const GENRES = [
  'Computer Science',
  'Artificial Intelligence',
  'Science',
  'Literature & Fiction',
  'History',
  'Self-Development',
  'Business & Psychology',
];

export const RecommendationsView: React.FC<RecommendationsViewProps> = ({
  onSelectBook,
  onToggleFavorite,
  favorites,
  targetBookForSimilar,
  onClearTargetBook,
}) => {
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Python', 'Algorithms']);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(['Computer Science']);
  const [readingLevel, setReadingLevel] = useState<string>('All Levels');
  const [customInterest, setCustomInterest] = useState('');
  
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [reasoningSummary, setReasoningSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [likedBookIds, setLikedBookIds] = useState<Set<string>>(new Set());
  const [dismissedBookIds, setDismissedBookIds] = useState<Set<string>>(new Set());

  // Load recommendations
  const fetchRecs = async () => {
    setIsLoading(true);
    try {
      const payload: RecommendationRequest = {
        userInterests: selectedInterests,
        preferredGenres: selectedGenres,
        readingLevel: readingLevel !== 'All Levels' ? readingLevel : undefined,
        favoriteBookIds: favorites.map(f => f.id),
        targetBookId: targetBookForSimilar?.id,
        count: 8,
      };

      const res = await getRecommendations(payload);
      setRecommendations(res.recommendations);
      setReasoningSummary(res.reasoningSummary);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecs();
  }, [targetBookForSimilar]);

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const addCustomInterest = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInterest.trim() && !selectedInterests.includes(customInterest.trim())) {
      setSelectedInterests(prev => [...prev, customInterest.trim()]);
      setCustomInterest('');
    }
  };

  const handleLike = (id: string) => {
    setLikedBookIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDismiss = (id: string) => {
    setDismissedBookIds(prev => new Set(prev).add(id));
  };

  const visibleRecommendations = recommendations.filter(r => !dismissedBookIds.has(r.book.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-800 text-xs font-semibold mb-2 border border-amber-500/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>AI Book Recommendation Agent</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif-title font-bold text-slate-900">
            Personalized Reader Recommendations
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Grounded content-based recommendations tailored to your reading level, interests, and real-time library availability.
          </p>
        </div>

        <button
          onClick={fetchRecs}
          disabled={isLoading}
          className="self-start md:self-auto px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-amber-600 text-white text-xs font-semibold transition-all shadow flex items-center gap-2 active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Regenerate Recommendations</span>
        </button>
      </div>

      {/* Target Book Banner (if redirected from 'Find Similar') */}
      {targetBookForSimilar && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-12 h-16 rounded bg-slate-200 overflow-hidden flex-shrink-0 shadow-sm">
              <img src={targetBookForSimilar.coverImage} alt={targetBookForSimilar.title} className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                Finding titles similar to:
              </span>
              <h4 className="font-serif-title font-bold text-slate-900 text-sm">
                {targetBookForSimilar.title} by {targetBookForSimilar.author}
              </h4>
              {!targetBookForSimilar.available && (
                <p className="text-xs text-rose-700 font-medium flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Original title is currently checked out — available alternatives are highlighted below!
                </p>
              )}
            </div>
          </div>

          {onClearTargetBook && (
            <button
              onClick={onClearTargetBook}
              className="p-1.5 rounded-lg text-amber-800 hover:bg-amber-200/60 transition-colors"
              title="Clear target book"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Preferences Builder */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-serif-title text-base font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-600" />
            Customize Reading Preferences
          </h3>
          <span className="text-xs text-slate-400">Settings update the retrieval ranking directly</span>
        </div>

        {/* Reading Level Selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Target Reading Level
          </label>
          <div className="flex flex-wrap gap-2">
            {['All Levels', 'Beginner', 'Intermediate', 'Advanced'].map(lvl => (
              <button
                key={lvl}
                onClick={() => setReadingLevel(lvl)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  readingLevel === lvl
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Preferred Genres */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Favorite Genres &amp; Disciplines
          </label>
          <div className="flex flex-wrap gap-2">
            {GENRES.map(genre => {
              const active = selectedGenres.includes(genre);
              return (
                <button
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {genre}
                </button>
              );
            })}
          </div>
        </div>

        {/* Topics & Interests */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Topics of Interest
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {POPULAR_INTERESTS.map(interest => {
              const active = selectedInterests.includes(interest);
              return (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    active
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  +{interest}
                </button>
              );
            })}
          </div>

          <form onSubmit={addCustomInterest} className="flex gap-2 max-w-md">
            <input
              type="text"
              value={customInterest}
              onChange={(e) => setCustomInterest(e.target.value)}
              placeholder="Add custom topic (e.g. 'Microservices', 'Quantum Physics')..."
              className="flex-1 py-1.5 px-3 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900 transition-colors"
            >
              Add
            </button>
          </form>
        </div>
      </div>

      {/* Reasoning Overview Pill */}
      {reasoningSummary && (
        <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-indigo-900 text-xs flex items-center gap-2.5">
          <Info className="w-4 h-4 text-indigo-600 flex-shrink-0" />
          <span className="font-medium">{reasoningSummary}</span>
        </div>
      )}

      {/* Recommendations Cards Grid */}
      {isLoading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-medium text-slate-600">Generating grounded recommendations...</p>
        </div>
      ) : visibleRecommendations.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
          <p className="text-slate-500 text-sm">No recommendations match this criteria. Try selecting broader genres or interests.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {visibleRecommendations.map((item) => {
            const b = item.book;
            const isFav = favorites.some(f => f.id === b.id);
            const isLiked = likedBookIds.has(b.id);
            const isAvailable = b.available && b.availableCopies > 0;

            return (
              <div
                key={b.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-amber-400 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Alternative Ribbon if alternative for unavailable */}
                {item.isAlternativeForUnavailable && (
                  <div className="mb-3 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>In-Stock Alternative for Checked-Out &ldquo;{item.alternativeForTitle}&rdquo;</span>
                  </div>
                )}

                <div>
                  <div className="flex gap-4 items-start mb-3">
                    {/* Cover */}
                    <div 
                      onClick={() => onSelectBook(b)}
                      className="w-20 h-28 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 shadow-sm cursor-pointer relative"
                    >
                      <img src={b.coverImage} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-800 border border-amber-500/30">
                          {item.matchScore}% Match
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleLike(b.id)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isLiked ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'text-slate-400 hover:text-slate-600 border-slate-200'
                            }`}
                            title="Like recommendation"
                          >
                            <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-emerald-600' : ''}`} />
                          </button>

                          <button
                            onClick={() => onToggleFavorite(b)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isFav ? 'bg-amber-50 text-amber-600 border-amber-300' : 'text-slate-400 hover:text-slate-600 border-slate-200'
                            }`}
                            title="Save to reading list"
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-500' : ''}`} />
                          </button>

                          <button
                            onClick={() => handleDismiss(b.id)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                            title="Dismiss recommendation"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h3
                        onClick={() => onSelectBook(b)}
                        className="font-serif-title font-bold text-base text-slate-900 group-hover:text-amber-700 cursor-pointer transition-colors line-clamp-1"
                      >
                        {b.title}
                      </h3>
                      <p className="text-xs text-slate-600 mb-1">
                        by <span className="text-slate-800">{b.author}</span> ({b.publicationYear})
                      </p>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mb-2">
                        <span>{b.category}</span>
                        <span>&bull;</span>
                        <span>{b.readingLevel}</span>
                        {b.rating && (
                          <>
                            <span>&bull;</span>
                            <span className="flex items-center gap-0.5 text-amber-600 font-semibold">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              {b.rating}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Why this was recommended banner */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 mb-3 text-xs leading-relaxed">
                    <span className="font-bold text-slate-700 block mb-0.5 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      Why it was recommended:
                    </span>
                    <p className="text-slate-600">{item.explanation}</p>
                  </div>
                </div>

                {/* Footer status & view button */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    {isAvailable ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Available ({b.availableCopies}/{b.totalCopies} in library)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        Checked Out (0/{b.totalCopies})
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onSelectBook(b)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-amber-600 text-white text-xs font-semibold transition-colors"
                  >
                    View Details
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
