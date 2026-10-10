import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import multer from 'multer';
import { catalogStore } from './server/catalogStore.js';
import { ragEngine } from './server/ragEngine.js';
import { recommendationEngine } from './server/recommendationEngine.js';
import { runCatalogTests } from './server/testRunner.js';
import { getActiveVectorModel } from './server/geminiClient.js';

const app = express();
const port = Number(process.env.PORT) || 3000;
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health / Status Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    vectorModel: getActiveVectorModel(),
  });
});

// GET /api/books - List and filter books
app.get('/api/books', (req, res) => {
  try {
    const filters = {
      genre: req.query.genre as string,
      author: req.query.author as string,
      language: req.query.language as string,
      readingLevel: req.query.readingLevel as string,
      availableOnly: req.query.availableOnly === 'true',
      yearMin: req.query.yearMin ? Number(req.query.yearMin) : undefined,
      yearMax: req.query.yearMax ? Number(req.query.yearMax) : undefined,
      sortBy: (req.query.sortBy as any) || 'relevance',
      sortOrder: (req.query.sortOrder as any) || 'desc',
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 12,
      query: req.query.query as string,
    };

    const result = catalogStore.filterAndSort(filters);
    res.json({
      books: result.books,
      total: result.total,
      page: filters.page,
      totalPages: Math.ceil(result.total / filters.limit) || 1,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to list books' });
  }
});

// GET /api/books/:id - Retrieve book details
app.get('/api/books/:id', (req, res) => {
  try {
    const book = catalogStore.getBookById(req.params.id);
    if (!book) {
      return res.status(404).json({ error: `Book with id "${req.params.id}" not found.` });
    }
    res.json({ book });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/search - Search books using keywords, semantic retrieval, and filters
app.post('/api/search', async (req, res) => {
  const startTime = Date.now();
  try {
    const { query = '', filters = {}, topK = 12 } = req.body;

    catalogStore.recordQuery(query);

    const retrieval = await ragEngine.retrieve(query, filters, topK);
    const durationMs = Date.now() - startTime;

    res.json({
      books: retrieval.books,
      scores: retrieval.scores,
      total: retrieval.books.length,
      mode: retrieval.retrievalMode,
      executionTimeMs: durationMs,
      vectorModel: getActiveVectorModel(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Search failed' });
  }
});

// POST /api/recommendations - Generate personalized book recommendations
app.post('/api/recommendations', async (req, res) => {
  try {
    const result = await recommendationEngine.getRecommendations(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate recommendations' });
  }
});

// POST /api/chat - Conversational library assistant with RAG pipeline
app.post('/api/chat', async (req, res) => {
  try {
    const { query, conversationHistory = [], filters = {} } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required.' });
    }

    catalogStore.recordQuery(query);

    const ragResponse = await ragEngine.answerQuestion({
      query,
      conversationHistory,
      filters,
    });

    res.json(ragResponse);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Chat assistant error' });
  }
});

// ADMIN ENDPOINTS

// Simple authorization middleware for admin endpoints
function requireAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  const adminKey = req.headers['x-admin-key'] || (authHeader ? authHeader.replace(/^Bearer\s+/, '') : '');
  // Default staff passcode is "admin123" (customizable via ADMIN_PASSCODE env var)
  const validKey = process.env.ADMIN_PASSCODE || 'admin123';
  if (adminKey !== validKey) {
    return res.status(401).json({ error: 'Unauthorized: Invalid administrative credentials.' });
  }
  next();
}

// POST /api/admin/books - Add book
app.post('/api/admin/books', requireAdminAuth, (req, res) => {
  try {
    const result = catalogStore.addBook(req.body);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    // Reindex in background
    ragEngine.rebuildIndex().catch(console.error);
    res.status(201).json({ book: result.book, message: 'Book created and queued for vector indexing.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/books/:id - Update book metadata or availability
app.patch('/api/admin/books/:id', requireAdminAuth, (req, res) => {
  try {
    const result = catalogStore.updateBook(req.params.id, req.body);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    // Reindex in background
    ragEngine.rebuildIndex().catch(console.error);
    res.json({ book: result.book, message: 'Book updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/books/:id - Delete book
app.delete('/api/admin/books/:id', requireAdminAuth, (req, res) => {
  try {
    const success = catalogStore.deleteBook(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Book not found.' });
    }
    // Reindex in background
    ragEngine.rebuildIndex().catch(console.error);
    res.json({ message: 'Book deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/books/import - Import catalog file (CSV or JSON, via body or multipart file)
app.post('/api/admin/books/import', requireAdminAuth, upload.single('file'), (req, res) => {
  try {
    let content = '';
    let format: 'json' | 'csv' = 'json';

    if (req.file) {
      content = req.file.buffer.toString('utf-8');
      format = req.file.originalname.endsWith('.csv') ? 'csv' : 'json';
    } else if (req.body.content) {
      content = req.body.content;
      format = req.body.format === 'csv' ? 'csv' : 'json';
    } else {
      return res.status(400).json({ error: 'Please provide file content or upload a catalog file.' });
    }

    const report = catalogStore.importCatalogData(content, format);
    if (report.imported > 0) {
      ragEngine.rebuildIndex().catch(console.error);
    }

    res.json({
      message: `Import processed: ${report.imported} books added.`,
      report,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/books/export - Export catalog
app.get('/api/admin/books/export', requireAdminAuth, (req, res) => {
  try {
    const format = req.query.format === 'csv' ? 'csv' : 'json';
    const books = catalogStore.getAllBooks();

    if (format === 'csv') {
      const headers = ['id', 'title', 'author', 'category', 'publicationYear', 'isbn', 'language', 'available', 'availableCopies', 'totalCopies', 'shelfLocation', 'readingLevel', 'pages', 'rating', 'description', 'tags'];
      const rows = books.map(b => {
        return headers.map(h => {
          let val = (b as any)[h];
          if (Array.isArray(val)) val = val.join(';');
          val = (val === undefined || val === null) ? '' : String(val);
          return `"${val.replace(/"/g, '""')}"`;
        }).join(',');
      });
      const csv = [headers.join(','), ...rows].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="library_catalog.csv"');
      return res.send(csv);
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="library_catalog.json"');
    res.json(books);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/index/rebuild - Rebuild vector index
app.post('/api/admin/index/rebuild', requireAdminAuth, async (req, res) => {
  try {
    const report = await ragEngine.rebuildIndex();
    res.json({
      message: 'Vector index successfully rebuilt.',
      report,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/index/status - Get vector index diagnostics
app.get('/api/admin/index/status', requireAdminAuth, (req, res) => {
  try {
    res.json(ragEngine.getIndexStatus());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/stats - Basic usage statistics
app.get('/api/admin/stats', requireAdminAuth, (req, res) => {
  try {
    const stats = catalogStore.getStats();
    stats.vectorModel = getActiveVectorModel();
    stats.lastIndexRebuiltAt = ragEngine.getIndexStatus().lastRebuiltAt || undefined;
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/run-tests - Run testing suite
app.post('/api/admin/run-tests', requireAdminAuth, async (req, res) => {
  try {
    const testReport = await runCatalogTests();
    res.json(testReport);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/reset - Reset catalog to initial 25 sample books
app.post('/api/admin/reset', requireAdminAuth, async (req, res) => {
  try {
    catalogStore.resetToDefaults();
    await ragEngine.rebuildIndex();
    res.json({ message: 'Catalog reset to standard verified sample collection (25 books).' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Frontend Middleware (Vite in dev, static files in prod)
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Smart Library AI server listening on http://0.0.0.0:${port}`);
    console.log(`Active Vector Embedding Provider: ${getActiveVectorModel()}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
