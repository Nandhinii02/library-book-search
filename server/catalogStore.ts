import fs from 'fs';
import path from 'path';
import { Book, SearchFilters, CatalogStats } from '../src/types/book.js';
import { INITIAL_BOOKS } from '../src/data/sampleBooks.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const CATALOG_FILE = path.join(DATA_DIR, 'catalog.json');
const STATS_FILE = path.join(DATA_DIR, 'stats.json');

export class CatalogStore {
  private books: Book[] = [];
  private popularQueries: Map<string, number> = new Map();

  constructor() {
    this.ensureDataDir();
    this.loadCatalog();
    this.loadStats();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadCatalog() {
    try {
      if (fs.existsSync(CATALOG_FILE)) {
        const raw = fs.readFileSync(CATALOG_FILE, 'utf-8');
        this.books = JSON.parse(raw);
        if (!Array.isArray(this.books) || this.books.length === 0) {
          this.resetToDefaults();
        }
      } else {
        this.resetToDefaults();
      }
    } catch (err) {
      console.warn('Error reading catalog file, initializing with sample data:', err);
      this.resetToDefaults();
    }
  }

  private loadStats() {
    try {
      if (fs.existsSync(STATS_FILE)) {
        const raw = fs.readFileSync(STATS_FILE, 'utf-8');
        const data = JSON.parse(raw);
        if (data.popularQueries && Array.isArray(data.popularQueries)) {
          data.popularQueries.forEach((item: { query: string; count: number }) => {
            this.popularQueries.set(item.query, item.count);
          });
        }
      }
    } catch (err) {
      // ignore
    }
  }

  private persistCatalog() {
    try {
      fs.writeFileSync(CATALOG_FILE, JSON.stringify(this.books, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write catalog file:', err);
    }
  }

  private persistStats() {
    try {
      const popularQueries = Array.from(this.popularQueries.entries())
        .map(([query, count]) => ({ query, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);
      fs.writeFileSync(STATS_FILE, JSON.stringify({ popularQueries }, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write stats file:', err);
    }
  }

  public resetToDefaults(): Book[] {
    this.books = JSON.parse(JSON.stringify(INITIAL_BOOKS));
    this.persistCatalog();
    return this.books;
  }

  public getAllBooks(): Book[] {
    return [...this.books];
  }

  public getBookById(id: string): Book | undefined {
    return this.books.find(b => b.id === id);
  }

  public getBookByIsbn(isbn: string): Book | undefined {
    const clean = isbn.replace(/[-\s]/g, '');
    return this.books.find(b => b.isbn.replace(/[-\s]/g, '') === clean);
  }

  public recordQuery(query: string) {
    if (!query || query.trim().length < 2) return;
    const clean = query.trim().toLowerCase();
    const count = this.popularQueries.get(clean) || 0;
    this.popularQueries.set(clean, count + 1);
    this.persistStats();
  }

  public getStats(): CatalogStats {
    const categoriesCount: Record<string, number> = {};
    let totalCopies = 0;
    let availableCopies = 0;
    let availableBooks = 0;

    this.books.forEach(b => {
      categoriesCount[b.category] = (categoriesCount[b.category] || 0) + 1;
      totalCopies += b.totalCopies;
      availableCopies += b.availableCopies;
      if (b.available && b.availableCopies > 0) {
        availableBooks++;
      }
    });

    const popularQueries = Array.from(this.popularQueries.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalBooks: this.books.length,
      availableBooks,
      borrowedBooks: this.books.length - availableBooks,
      categoriesCount,
      totalCopies,
      availableCopies,
      vectorIndexSize: this.books.length,
      vectorModel: '',
      popularQueries,
    };
  }

  public filterAndSort(filters: SearchFilters): { books: Book[]; total: number } {
    let results = [...this.books];

    // Filter by genre / category
    if (filters.genre && filters.genre !== 'All') {
      results = results.filter(b => b.category.toLowerCase() === filters.genre?.toLowerCase());
    }

    // Filter by author
    if (filters.author) {
      const a = filters.author.toLowerCase();
      results = results.filter(b => b.author.toLowerCase().includes(a));
    }

    // Filter by language
    if (filters.language && filters.language !== 'All') {
      results = results.filter(b => b.language.toLowerCase() === filters.language?.toLowerCase());
    }

    // Filter by reading level
    if (filters.readingLevel && filters.readingLevel !== 'All') {
      results = results.filter(b => b.readingLevel.toLowerCase() === filters.readingLevel?.toLowerCase());
    }

    // Filter by availability
    if (filters.availableOnly) {
      results = results.filter(b => b.available && b.availableCopies > 0);
    }

    // Filter by year
    if (filters.yearMin !== undefined) {
      results = results.filter(b => b.publicationYear >= filters.yearMin!);
    }
    if (filters.yearMax !== undefined) {
      results = results.filter(b => b.publicationYear <= filters.yearMax!);
    }

    // Keyword filtering if query provided
    if (filters.query && filters.query.trim()) {
      const q = filters.query.toLowerCase().trim();
      this.recordQuery(q);
      const terms = q.split(/\s+/).filter(t => t.length > 0);
      results = results.filter(b => {
        const fullContent = `${b.title} ${b.author} ${b.description} ${b.category} ${b.isbn} ${b.tags.join(' ')} ${b.shelfLocation}`.toLowerCase();
        return terms.every(term => fullContent.includes(term)) || fullContent.includes(q);
      });
    }

    // Sorting
    const sortBy = filters.sortBy || 'relevance';
    const sortOrder = filters.sortOrder || 'desc';
    const mult = sortOrder === 'asc' ? 1 : -1;

    if (sortBy === 'title') {
      results.sort((a, b) => a.title.localeCompare(b.title) * mult);
    } else if (sortBy === 'year') {
      results.sort((a, b) => (a.publicationYear - b.publicationYear) * mult);
    } else if (sortBy === 'rating') {
      results.sort((a, b) => ((a.rating || 0) - (b.rating || 0)) * mult);
    }

    const total = results.length;
    const page = filters.page || 1;
    const limit = filters.limit || 12;
    const start = (page - 1) * limit;
    const paginated = results.slice(start, start + limit);

    return { books: paginated, total };
  }

  public addBook(bookData: Partial<Book>): { book?: Book; error?: string } {
    const validation = this.validateBookRecord(bookData);
    if (!validation.valid) {
      return { error: validation.errors.join('; ') };
    }

    // Check duplicate ISBN
    if (bookData.isbn && this.getBookByIsbn(bookData.isbn)) {
      return { error: `Duplicate ISBN: A book with ISBN ${bookData.isbn} already exists.` };
    }

    const newBook: Book = {
      id: bookData.id || `book-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: bookData.title!.trim(),
      author: bookData.author!.trim(),
      description: bookData.description!.trim(),
      category: bookData.category || 'General',
      publicationYear: Number(bookData.publicationYear) || new Date().getFullYear(),
      isbn: bookData.isbn!.trim(),
      language: bookData.language || 'English',
      available: bookData.available ?? true,
      totalCopies: Number(bookData.totalCopies) || 1,
      availableCopies: Number(bookData.availableCopies ?? bookData.totalCopies ?? 1),
      shelfLocation: bookData.shelfLocation || `SEC-${Math.floor(Math.random() * 900 + 100)}`,
      coverImage: bookData.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      readingLevel: bookData.readingLevel || 'All Levels',
      pages: Number(bookData.pages) || 250,
      rating: Number(bookData.rating) || 4.5,
      publisher: bookData.publisher || 'Independent Publisher',
      tags: Array.isArray(bookData.tags) ? bookData.tags : (typeof bookData.tags === 'string' ? (bookData.tags as string).split(',').map((t: string) => t.trim()) : []),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (newBook.availableCopies <= 0) {
      newBook.available = false;
    }

    this.books.unshift(newBook);
    this.persistCatalog();
    return { book: newBook };
  }

  public updateBook(id: string, updates: Partial<Book>): { book?: Book; error?: string } {
    const index = this.books.findIndex(b => b.id === id);
    if (index === -1) {
      return { error: `Book with id ${id} not found.` };
    }

    const existing = this.books[index];

    // If ISBN changed, check duplicate
    if (updates.isbn && updates.isbn !== existing.isbn) {
      const dup = this.getBookByIsbn(updates.isbn);
      if (dup && dup.id !== id) {
        return { error: `ISBN ${updates.isbn} is already assigned to book "${dup.title}".` };
      }
    }

    const updated: Book = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Ensure copies consistency
    if (updated.availableCopies <= 0) {
      updated.available = false;
      updated.availableCopies = 0;
    } else {
      updated.available = true;
    }

    if (updated.availableCopies > updated.totalCopies) {
      updated.totalCopies = updated.availableCopies;
    }

    this.books[index] = updated;
    this.persistCatalog();
    return { book: updated };
  }

  public deleteBook(id: string): boolean {
    const initialLen = this.books.length;
    this.books = this.books.filter(b => b.id !== id);
    if (this.books.length !== initialLen) {
      this.persistCatalog();
      return true;
    }
    return false;
  }

  public validateBookRecord(data: Partial<Book>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!data.title || data.title.trim().length === 0) {
      errors.push('Title is required.');
    }
    if (!data.author || data.author.trim().length === 0) {
      errors.push('Author is required.');
    }
    if (!data.isbn || data.isbn.trim().length === 0) {
      errors.push('ISBN is required.');
    }
    if (!data.description || data.description.trim().length < 10) {
      errors.push('Description must be at least 10 characters long.');
    }
    if (data.publicationYear !== undefined) {
      const year = Number(data.publicationYear);
      if (isNaN(year) || year < 1000 || year > 2030) {
        errors.push('Publication year must be between 1000 and 2030.');
      }
    }
    if (data.totalCopies !== undefined && (isNaN(Number(data.totalCopies)) || Number(data.totalCopies) < 0)) {
      errors.push('Total copies must be 0 or greater.');
    }
    if (data.availableCopies !== undefined && (isNaN(Number(data.availableCopies)) || Number(data.availableCopies) < 0)) {
      errors.push('Available copies must be 0 or greater.');
    }
    return { valid: errors.length === 0, errors };
  }

  public importCatalogData(content: string, format: 'json' | 'csv'): {
    totalRecords: number;
    validRecords: number;
    invalidRecords: number;
    imported: number;
    duplicateIsbns: string[];
    errors: { row: number; title?: string; isbn?: string; message: string }[];
  } {
    let rawItems: any[] = [];
    const errors: { row: number; title?: string; isbn?: string; message: string }[] = [];
    const duplicateIsbns: string[] = [];

    if (format === 'json') {
      try {
        const parsed = JSON.parse(content);
        rawItems = Array.isArray(parsed) ? parsed : (parsed.books || [parsed]);
      } catch (err: any) {
        return {
          totalRecords: 0,
          validRecords: 0,
          invalidRecords: 0,
          imported: 0,
          duplicateIsbns: [],
          errors: [{ row: 0, message: `Invalid JSON syntax: ${err.message}` }],
        };
      }
    } else {
      // Parse CSV
      rawItems = this.parseCsv(content);
    }

    const seenIsbns = new Set<string>();
    const validBooksToImport: Book[] = [];

    rawItems.forEach((item, index) => {
      const rowNum = index + 1;
      const validation = this.validateBookRecord(item);
      
      const cleanIsbn = (item.isbn || '').toString().replace(/[-\s]/g, '').trim();
      
      if (!cleanIsbn) {
        errors.push({ row: rowNum, title: item.title, message: 'Missing ISBN' });
        return;
      }

      if (seenIsbns.has(cleanIsbn)) {
        duplicateIsbns.push(item.isbn);
        errors.push({ row: rowNum, title: item.title, isbn: item.isbn, message: 'Duplicate ISBN in import batch' });
        return;
      }
      seenIsbns.add(cleanIsbn);

      // Check against current database
      const existing = this.getBookByIsbn(cleanIsbn);
      if (existing) {
        duplicateIsbns.push(item.isbn);
        errors.push({ row: rowNum, title: item.title, isbn: item.isbn, message: `ISBN ${item.isbn} already exists in library catalog` });
        return;
      }

      if (!validation.valid) {
        errors.push({ row: rowNum, title: item.title, isbn: item.isbn, message: validation.errors.join('; ') });
        return;
      }

      const book: Book = {
        id: `book-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: item.title.trim(),
        author: item.author.trim(),
        description: item.description.trim(),
        category: item.category || 'General',
        publicationYear: Number(item.publicationYear) || new Date().getFullYear(),
        isbn: item.isbn.toString().trim(),
        language: item.language || 'English',
        available: item.available === true || item.available === 'true' || (Number(item.availableCopies || 1) > 0),
        totalCopies: Number(item.totalCopies) || 1,
        availableCopies: Number(item.availableCopies ?? item.totalCopies ?? 1),
        shelfLocation: item.shelfLocation || `SEC-${Math.floor(Math.random() * 900 + 100)}`,
        coverImage: item.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
        readingLevel: item.readingLevel || 'All Levels',
        pages: Number(item.pages) || 300,
        rating: Number(item.rating) || 4.5,
        publisher: item.publisher || 'Independent Publisher',
        tags: Array.isArray(item.tags)
          ? item.tags
          : (typeof item.tags === 'string' ? item.tags.split(',').map((t: string) => t.trim()) : []),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (book.availableCopies <= 0) book.available = false;

      validBooksToImport.push(book);
    });

    if (validBooksToImport.length > 0) {
      this.books.push(...validBooksToImport);
      this.persistCatalog();
    }

    return {
      totalRecords: rawItems.length,
      validRecords: validBooksToImport.length,
      invalidRecords: errors.length,
      imported: validBooksToImport.length,
      duplicateIsbns,
      errors,
    };
  }

  private parseCsv(content: string): any[] {
    const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const records: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Regex CSV splitter that handles quoted commas
      const matches: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          matches.push(current.trim().replace(/^["']|["']$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      matches.push(current.trim().replace(/^["']|["']$/g, ''));

      const item: any = {};
      headers.forEach((h, colIndex) => {
        item[h] = matches[colIndex] || '';
      });
      records.push(item);
    }
    return records;
  }
}

export const catalogStore = new CatalogStore();
