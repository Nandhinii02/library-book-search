import { Book, SearchFilters, SearchResult, RecommendationRequest, RecommendationItem, CatalogStats, TestResultItem } from '../types/book';

const API_BASE = '/api';

export async function fetchBooks(filters: SearchFilters = {}): Promise<{ books: Book[]; total: number; page: number; totalPages: number }> {
  const params = new URLSearchParams();
  if (filters.genre) params.append('genre', filters.genre);
  if (filters.author) params.append('author', filters.author);
  if (filters.language) params.append('language', filters.language);
  if (filters.readingLevel) params.append('readingLevel', filters.readingLevel);
  if (filters.availableOnly) params.append('availableOnly', 'true');
  if (filters.yearMin !== undefined) params.append('yearMin', filters.yearMin.toString());
  if (filters.yearMax !== undefined) params.append('yearMax', filters.yearMax.toString());
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.query) params.append('query', filters.query);

  const res = await fetch(`${API_BASE}/books?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch books: ${res.statusText}`);
  return res.json();
}

export async function fetchBookById(id: string): Promise<Book> {
  const res = await fetch(`${API_BASE}/books/${id}`);
  if (!res.ok) throw new Error(`Book not found: ${res.statusText}`);
  const data = await res.json();
  return data.book;
}

export async function searchBooks(query: string, filters: SearchFilters = {}, topK = 12): Promise<SearchResult> {
  const res = await fetch(`${API_BASE}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, filters, topK }),
  });
  if (!res.ok) throw new Error(`Search request failed: ${res.statusText}`);
  return res.json();
}

export async function getRecommendations(req: RecommendationRequest): Promise<{
  recommendations: RecommendationItem[];
  reasoningSummary: string;
  targetBook?: Book;
  suggestedFollowUps: string[];
}> {
  const res = await fetch(`${API_BASE}/recommendations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`Recommendations failed: ${res.statusText}`);
  return res.json();
}

export async function sendChatMessage(query: string, conversationHistory: { role: 'user' | 'assistant'; content: string }[] = [], filters: SearchFilters = {}): Promise<{
  answer: string;
  isGrounded: boolean;
  limitationsStated: boolean;
  retrievedBooks: Book[];
  citedBookIds: string[];
  suggestedQueries: string[];
  retrievalMode: string;
}> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, conversationHistory, filters }),
  });
  if (!res.ok) throw new Error(`Chat request failed: ${res.statusText}`);
  return res.json();
}

// ADMIN API HELPERS
function getAdminHeaders(passcode: string) {
  return {
    'Content-Type': 'application/json',
    'x-admin-key': passcode,
  };
}

export async function adminAddBook(bookData: Partial<Book>, passcode: string): Promise<{ book: Book; message: string }> {
  const res = await fetch(`${API_BASE}/admin/books`, {
    method: 'POST',
    headers: getAdminHeaders(passcode),
    body: JSON.stringify(bookData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to add book');
  return data;
}

export async function adminUpdateBook(id: string, updates: Partial<Book>, passcode: string): Promise<{ book: Book; message: string }> {
  const res = await fetch(`${API_BASE}/admin/books/${id}`, {
    method: 'PATCH',
    headers: getAdminHeaders(passcode),
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update book');
  return data;
}

export async function adminDeleteBook(id: string, passcode: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/admin/books/${id}`, {
    method: 'DELETE',
    headers: getAdminHeaders(passcode),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete book');
  return data;
}

export async function adminImportCatalog(content: string, format: 'json' | 'csv', passcode: string) {
  const res = await fetch(`${API_BASE}/admin/books/import`, {
    method: 'POST',
    headers: getAdminHeaders(passcode),
    body: JSON.stringify({ content, format }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Import failed');
  return data;
}

export async function adminRebuildIndex(passcode: string) {
  const res = await fetch(`${API_BASE}/admin/index/rebuild`, {
    method: 'POST',
    headers: getAdminHeaders(passcode),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Index rebuild failed');
  return data;
}

export async function adminGetIndexStatus(passcode: string) {
  const res = await fetch(`${API_BASE}/admin/index/status`, {
    headers: getAdminHeaders(passcode),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to get index status');
  return data;
}

export async function adminGetStats(passcode: string): Promise<CatalogStats> {
  const res = await fetch(`${API_BASE}/admin/stats`, {
    headers: getAdminHeaders(passcode),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to get stats');
  return data;
}

export async function adminRunTests(passcode: string): Promise<{
  results: TestResultItem[];
  summary: { total: number; passed: number; failed: number; durationMs: number };
}> {
  const res = await fetch(`${API_BASE}/admin/run-tests`, {
    method: 'POST',
    headers: getAdminHeaders(passcode),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Test run failed');
  return data;
}

export async function adminResetCatalog(passcode: string) {
  const res = await fetch(`${API_BASE}/admin/reset`, {
    method: 'POST',
    headers: getAdminHeaders(passcode),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Reset failed');
  return data;
}
