export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  category: string;
  publicationYear: number;
  isbn: string;
  language: string;
  available: boolean;
  totalCopies: number;
  availableCopies: number;
  shelfLocation: string;
  coverImage?: string;
  readingLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  pages?: number;
  rating?: number;
  publisher?: string;
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SearchFilters {
  query?: string;
  genre?: string;
  author?: string;
  language?: string;
  readingLevel?: string;
  availableOnly?: boolean;
  yearMin?: number;
  yearMax?: number;
  sortBy?: 'relevance' | 'title' | 'year' | 'rating';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SearchResult {
  books: Book[];
  total: number;
  page?: number;
  totalPages?: number;
  query?: string;
  executionTimeMs: number;
  mode: 'hybrid' | 'semantic' | 'keyword';
  appliedFilters?: Partial<SearchFilters>;
  aiSummary?: string;
  scores?: { bookId: string; score: number }[];
  vectorModel?: string;
}

export interface RecommendationRequest {
  userInterests?: string[];
  preferredGenres?: string[];
  readingLevel?: string;
  favoriteAuthors?: string[];
  favoriteBookIds?: string[];
  targetBookId?: string; // e.g. "books like X"
  count?: number;
}

export interface RecommendationItem {
  book: Book;
  matchScore: number; // 0 to 100
  explanation: string;
  matchingFactors: string[];
  isAlternativeForUnavailable?: boolean;
  alternativeForTitle?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  retrievedBooks?: Book[];
  suggestedQueries?: string[];
  isGrounded?: boolean;
  limitationsStated?: boolean;
}

export interface CatalogStats {
  totalBooks: number;
  availableBooks: number;
  borrowedBooks: number;
  categoriesCount: Record<string, number>;
  totalCopies: number;
  availableCopies: number;
  vectorIndexSize: number;
  vectorModel: string;
  lastIndexRebuiltAt?: string;
  popularQueries: { query: string; count: number }[];
}

export interface TestResultItem {
  id: string;
  name: string;
  category: string;
  passed: boolean;
  durationMs: number;
  message: string;
  details?: any;
}
