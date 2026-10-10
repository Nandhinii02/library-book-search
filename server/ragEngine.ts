import fs from 'fs';
import path from 'path';
import { Book, SearchFilters } from '../src/types/book.js';
import { catalogStore } from './catalogStore.js';
import { embedText, cosineSimilarity, getActiveVectorModel, generateGroundedAnswer } from './geminiClient.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const INDEX_FILE = path.join(DATA_DIR, 'vector_index.json');

export interface IndexedDocument {
  bookId: string;
  chunkId: string;
  text: string;
  embedding: number[];
  metadata: {
    title: string;
    author: string;
    category: string;
    publicationYear: number;
    isbn: string;
    readingLevel: string;
    language: string;
    available: boolean;
  };
}

export class RagEngine {
  private index: IndexedDocument[] = [];
  private isRebuilding = false;
  private lastRebuiltAt: string | null = null;

  constructor() {
    this.loadIndex();
  }

  private loadIndex() {
    try {
      if (fs.existsSync(INDEX_FILE)) {
        const raw = fs.readFileSync(INDEX_FILE, 'utf-8');
        const data = JSON.parse(raw);
        if (Array.isArray(data.documents) && data.documents.length > 0) {
          this.index = data.documents;
          this.lastRebuiltAt = data.lastRebuiltAt || new Date().toISOString();
          console.log(`Loaded ${this.index.length} vector embeddings from cache.`);
          return;
        }
      }
    } catch (err) {
      console.warn('Could not load cached vector index:', err);
    }
    // Auto-build in background
    setTimeout(() => {
      this.rebuildIndex().catch(err => console.error('Initial vector index build failed:', err));
    }, 100);
  }

  private persistIndex() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(INDEX_FILE, JSON.stringify({
        lastRebuiltAt: this.lastRebuiltAt,
        model: getActiveVectorModel(),
        documents: this.index,
      }, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write vector index to disk:', err);
    }
  }

  // Step 2: Document preparation
  public prepareDocumentChunk(book: Book): string {
    return `Title: ${book.title}
Author: ${book.author}
Category: ${book.category}
Publication Year: ${book.publicationYear}
Reading Level: ${book.readingLevel}
Language: ${book.language}
ISBN: ${book.isbn}
Tags: ${book.tags.join(', ')}
Description: ${book.description}
Shelf Call Number: ${book.shelfLocation}
Status: ${book.available ? 'Available in library' : 'Currently checked out'}`;
  }

  // Step 3 & 4: Ingestion, Embedding & Vector Storage
  public async rebuildIndex(): Promise<{ count: number; durationMs: number; model: string }> {
    if (this.isRebuilding) {
      throw new Error('Index rebuild is already in progress.');
    }
    this.isRebuilding = true;
    const startTime = Date.now();

    try {
      const books = catalogStore.getAllBooks();
      const newIndex: IndexedDocument[] = [];

      for (const book of books) {
        const textChunk = this.prepareDocumentChunk(book);
        const embedding = await embedText(textChunk);

        newIndex.push({
          bookId: book.id,
          chunkId: `chunk-${book.id}-0`,
          text: textChunk,
          embedding,
          metadata: {
            title: book.title,
            author: book.author,
            category: book.category,
            publicationYear: book.publicationYear,
            isbn: book.isbn,
            readingLevel: book.readingLevel,
            language: book.language,
            available: book.available,
          },
        });
      }

      this.index = newIndex;
      this.lastRebuiltAt = new Date().toISOString();
      this.persistIndex();

      const durationMs = Date.now() - startTime;
      return {
        count: this.index.length,
        durationMs,
        model: getActiveVectorModel(),
      };
    } finally {
      this.isRebuilding = false;
    }
  }

  public getIndexStatus() {
    return {
      totalIndexed: this.index.length,
      embeddingDimensions: this.index[0]?.embedding?.length || 0,
      model: getActiveVectorModel(),
      lastRebuiltAt: this.lastRebuiltAt,
      isRebuilding: this.isRebuilding,
    };
  }

  // Step 5: Retrieval with Semantic Similarity + Lexical hybrid search & metadata filtering
  public async retrieve(query: string, filters: SearchFilters = {}, topK = 8): Promise<{
    books: Book[];
    scores: { bookId: string; score: number }[];
    retrievalMode: 'semantic' | 'hybrid' | 'keyword';
  }> {
    const allBooks = catalogStore.getAllBooks();
    const booksMap = new Map<string, Book>(allBooks.map(b => [b.id, b]));

    if (!query || query.trim().length === 0) {
      const filtered = catalogStore.filterAndSort(filters);
      return {
        books: filtered.books,
        scores: filtered.books.map(b => ({ bookId: b.id, score: 1.0 })),
        retrievalMode: 'keyword',
      };
    }

    const cleanQuery = query.trim().toLowerCase();
    const queryTerms = cleanQuery.split(/\s+/).filter(t => t.length > 0);

    // Generate query embedding
    let queryEmbedding: number[] | null = null;
    try {
      queryEmbedding = await embedText(query);
    } catch (err) {
      console.warn('Failed to embed query, using lexical fallback:', err);
    }

    const scoredDocs: { book: Book; score: number }[] = [];

    for (const doc of this.index) {
      const book = booksMap.get(doc.bookId);
      if (!book) continue;

      // Apply metadata filters first (hard constraints)
      if (filters.genre && filters.genre !== 'All' && book.category.toLowerCase() !== filters.genre.toLowerCase()) {
        continue;
      }
      if (filters.author && !book.author.toLowerCase().includes(filters.author.toLowerCase())) {
        continue;
      }
      if (filters.language && filters.language !== 'All' && book.language.toLowerCase() !== filters.language.toLowerCase()) {
        continue;
      }
      if (filters.readingLevel && filters.readingLevel !== 'All' && book.readingLevel.toLowerCase() !== filters.readingLevel.toLowerCase()) {
        continue;
      }
      if (filters.availableOnly && (!book.available || book.availableCopies <= 0)) {
        continue;
      }
      if (filters.yearMin !== undefined && book.publicationYear < filters.yearMin) {
        continue;
      }
      if (filters.yearMax !== undefined && book.publicationYear > filters.yearMax) {
        continue;
      }

      // 1. Semantic Score (cosine similarity: range [-1, 1] mapped to [0, 1])
      let semanticScore = 0;
      if (queryEmbedding && doc.embedding && doc.embedding.length > 0) {
        const sim = cosineSimilarity(queryEmbedding, doc.embedding);
        semanticScore = Math.max(0, sim);
      }

      // 2. Lexical / Keyword score (exact matches on title, author, isbn, tags)
      let lexicalScore = 0;
      const titleLower = book.title.toLowerCase();
      const authorLower = book.author.toLowerCase();
      const descLower = book.description.toLowerCase();
      const isbnClean = book.isbn.replace(/[-\s]/g, '');
      const queryClean = cleanQuery.replace(/[-\s]/g, '');

      // Direct ISBN lookup boost
      if (queryClean.length >= 8 && isbnClean.includes(queryClean)) {
        lexicalScore += 10.0;
      }

      // Title exact / substring match
      if (titleLower === cleanQuery) {
        lexicalScore += 5.0;
      } else if (titleLower.includes(cleanQuery)) {
        lexicalScore += 3.0;
      }

      // Author match
      if (authorLower.includes(cleanQuery)) {
        lexicalScore += 3.0;
      }

      // Term overlaps
      queryTerms.forEach(term => {
        if (titleLower.includes(term)) lexicalScore += 1.0;
        if (authorLower.includes(term)) lexicalScore += 0.8;
        if (book.tags.some(tag => tag.toLowerCase().includes(term))) lexicalScore += 0.7;
        if (descLower.includes(term)) lexicalScore += 0.3;
      });

      // Hybrid rank fusion: 60% semantic + 40% normalized lexical
      const normalizedLexical = Math.min(1.0, lexicalScore / 4.0);
      const combinedScore = queryEmbedding ? (semanticScore * 0.65 + normalizedLexical * 0.35) : normalizedLexical;

      if (combinedScore > 0.05 || lexicalScore > 0) {
        scoredDocs.push({ book, score: combinedScore });
      }
    }

    // Sort by descending score
    scoredDocs.sort((a, b) => b.score - a.score);

    const topResults = scoredDocs.slice(0, topK);

    return {
      books: topResults.map(r => r.book),
      scores: topResults.map(r => ({ bookId: r.book.id, score: Math.round(r.score * 100) / 100 })),
      retrievalMode: queryEmbedding ? 'hybrid' : 'keyword',
    };
  }

  // Step 6: LLM Response Generation (Grounded Q&A)
  public async answerQuestion(params: {
    query: string;
    conversationHistory?: { role: 'user' | 'assistant'; content: string }[];
    filters?: SearchFilters;
  }) {
    const { query, conversationHistory = [], filters = {} } = params;

    // Retrieve top relevant books for context
    const retrieval = await this.retrieve(query, filters, 6);
    const retrievedBooks = retrieval.books;

    // Pass to grounded LLM answer generator
    const answer = await generateGroundedAnswer({
      userQuery: query,
      retrievedBooks,
      conversationHistory,
    });

    return {
      answer: answer.text,
      isGrounded: answer.isGrounded,
      limitationsStated: answer.limitationsStated,
      retrievedBooks,
      citedBookIds: answer.citedBookIds,
      suggestedQueries: answer.suggestedQueries,
      retrievalMode: retrieval.retrievalMode,
    };
  }
}

export const ragEngine = new RagEngine();
