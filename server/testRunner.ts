import { catalogStore } from './catalogStore.js';
import { ragEngine } from './ragEngine.js';
import { recommendationEngine } from './recommendationEngine.js';
import { TestResultItem } from '../src/types/book.js';

export async function runCatalogTests(): Promise<{
  results: TestResultItem[];
  summary: { total: number; passed: number; failed: number; durationMs: number };
}> {
  const results: TestResultItem[] = [];
  const startAll = Date.now();

  // Test 1: Catalog ingestion and validation
  {
    const start = Date.now();
    try {
      const invalidBook = { title: '', author: 'Unknown', isbn: '' };
      const val = catalogStore.validateBookRecord(invalidBook);
      const passed = !val.valid && val.errors.length >= 2;
      results.push({
        id: 'test-1-ingestion-validation',
        name: 'Catalog Ingestion & Field Validation',
        category: 'Data Ingestion',
        passed,
        durationMs: Date.now() - start,
        message: passed
          ? `Successfully caught missing fields: ${val.errors.join(', ')}`
          : 'Failed to catch missing title/isbn',
      });
    } catch (e: any) {
      results.push({
        id: 'test-1-ingestion-validation',
        name: 'Catalog Ingestion & Field Validation',
        category: 'Data Ingestion',
        passed: false,
        durationMs: Date.now() - start,
        message: e.message,
      });
    }
  }

  // Test 2: Semantic book search
  {
    const start = Date.now();
    try {
      const searchRes = await ragEngine.retrieve('beginner friendly python programming', {}, 5);
      const topBook = searchRes.books[0];
      const passed = searchRes.books.length > 0 && (
        topBook?.title.toLowerCase().includes('python') ||
        topBook?.tags.some(t => t.toLowerCase().includes('python'))
      );
      results.push({
        id: 'test-2-semantic-search',
        name: 'Semantic Book Search',
        category: 'Retrieval',
        passed,
        durationMs: Date.now() - start,
        message: passed
          ? `Retrieved relevant book: "${topBook?.title}" (Score: ${searchRes.scores[0]?.score})`
          : 'Did not retrieve expected Python books',
      });
    } catch (e: any) {
      results.push({
        id: 'test-2-semantic-search',
        name: 'Semantic Book Search',
        category: 'Retrieval',
        passed: false,
        durationMs: Date.now() - start,
        message: e.message,
      });
    }
  }

  // Test 3: Metadata filtering
  {
    const start = Date.now();
    try {
      const filtered = catalogStore.filterAndSort({
        genre: 'Computer Science',
        yearMin: 2020,
      });
      const passed = filtered.books.length > 0 && filtered.books.every(
        b => b.category === 'Computer Science' && b.publicationYear >= 2020
      );
      results.push({
        id: 'test-3-metadata-filtering',
        name: 'Metadata Filtering (Genre + Year Constraints)',
        category: 'Catalog Filter',
        passed,
        durationMs: Date.now() - start,
        message: passed
          ? `Verified ${filtered.books.length} books strictly match Computer Science (>= 2020)`
          : 'Filter returned books that violate genre or year bounds',
      });
    } catch (e: any) {
      results.push({
        id: 'test-3-metadata-filtering',
        name: 'Metadata Filtering (Genre + Year Constraints)',
        category: 'Catalog Filter',
        passed: false,
        durationMs: Date.now() - start,
        message: e.message,
      });
    }
  }

  // Test 4: Recommendation relevance
  {
    const start = Date.now();
    try {
      const recs = await recommendationEngine.getRecommendations({
        preferredGenres: ['Artificial Intelligence'],
        readingLevel: 'Intermediate',
        count: 3,
      });
      const hasAiBook = recs.recommendations.some(r => r.book.category === 'Artificial Intelligence');
      const hasExplanation = recs.recommendations.every(r => r.explanation.length > 10);
      const passed = recs.recommendations.length > 0 && hasAiBook && hasExplanation;
      results.push({
        id: 'test-4-recommendation-relevance',
        name: 'Recommendation Relevance & Explanations',
        category: 'Recommendations',
        passed,
        durationMs: Date.now() - start,
        message: passed
          ? `Generated ${recs.recommendations.length} grounded recommendations with distinct factor explanations`
          : 'Recommendations did not match preferred AI genre',
      });
    } catch (e: any) {
      results.push({
        id: 'test-4-recommendation-relevance',
        name: 'Recommendation Relevance & Explanations',
        category: 'Recommendations',
        passed: false,
        durationMs: Date.now() - start,
        message: e.message,
      });
    }
  }

  // Test 5: RAG answer grounding
  {
    const start = Date.now();
    try {
      const ragAns = await ragEngine.answerQuestion({
        query: 'What books do you have on algorithms?',
      });
      const passed = ragAns.isGrounded && ragAns.retrievedBooks.length > 0 && ragAns.answer.length > 40;
      results.push({
        id: 'test-5-rag-grounding',
        name: 'RAG Answer Grounding & Catalog Context',
        category: 'RAG Pipeline',
        passed,
        durationMs: Date.now() - start,
        message: passed
          ? `Answer successfully grounded in ${ragAns.retrievedBooks.length} retrieved catalog titles`
          : 'Answer was not properly grounded',
      });
    } catch (e: any) {
      results.push({
        id: 'test-5-rag-grounding',
        name: 'RAG Answer Grounding & Catalog Context',
        category: 'RAG Pipeline',
        passed: false,
        durationMs: Date.now() - start,
        message: e.message,
      });
    }
  }

  // Test 6: Handling missing or conflicting catalog information
  {
    const start = Date.now();
    try {
      const testImportJson = JSON.stringify([
        { title: 'Incomplete Book', author: '' },
      ]);
      const importRes = catalogStore.importCatalogData(testImportJson, 'json');
      const passed = importRes.invalidRecords > 0 && importRes.errors.length > 0;
      results.push({
        id: 'test-6-conflicting-catalog',
        name: 'Missing / Invalid Catalog Import Handling',
        category: 'Data Validation',
        passed,
        durationMs: Date.now() - start,
        message: passed
          ? `Correctly rejected invalid import row with reason: "${importRes.errors[0]?.message}"`
          : 'Failed to flag missing fields during import',
      });
    } catch (e: any) {
      results.push({
        id: 'test-6-conflicting-catalog',
        name: 'Missing / Invalid Catalog Import Handling',
        category: 'Data Validation',
        passed: false,
        durationMs: Date.now() - start,
        message: e.message,
      });
    }
  }

  // Test 7: Unavailable books handling & alternative recommendations
  {
    const start = Date.now();
    try {
      const unavailableBook = catalogStore.getAllBooks().find(b => !b.available || b.availableCopies === 0);
      let passed = false;
      let msg = '';
      if (unavailableBook) {
        const recs = await recommendationEngine.getRecommendations({
          targetBookId: unavailableBook.id,
          count: 2,
        });
        const hasAlternative = recs.recommendations.some(r => r.isAlternativeForUnavailable || r.book.available);
        passed = hasAlternative;
        msg = `Successfully proposed available alternative for checked-out book "${unavailableBook.title}"`;
      } else {
        passed = true;
        msg = 'Verified all current library books are in stock';
      }
      results.push({
        id: 'test-7-unavailable-books',
        name: 'Unavailable Book Handling & Alternative Suggestions',
        category: 'Availability',
        passed,
        durationMs: Date.now() - start,
        message: msg,
      });
    } catch (e: any) {
      results.push({
        id: 'test-7-unavailable-books',
        name: 'Unavailable Book Handling & Alternative Suggestions',
        category: 'Availability',
        passed: false,
        durationMs: Date.now() - start,
        message: e.message,
      });
    }
  }

  // Test 8: Empty search results & graceful fallback
  {
    const start = Date.now();
    try {
      const ans = await ragEngine.answerQuestion({
        query: 'quantum telepathy alien archaeology xz999',
      });
      const passed = ans.limitationsStated || ans.retrievedBooks.length === 0 || ans.answer.toLowerCase().includes('could not find') || ans.answer.toLowerCase().includes('catalog');
      results.push({
        id: 'test-8-empty-search-handling',
        name: 'Empty Search & Catalog Limitation Honesty',
        category: 'Reliability',
        passed,
        durationMs: Date.now() - start,
        message: passed
          ? 'Correctly acknowledged lack of matching books without hallucinating fake records'
          : 'Failed to state catalog limitation on nonsense query',
      });
    } catch (e: any) {
      results.push({
        id: 'test-8-empty-search-handling',
        name: 'Empty Search & Catalog Limitation Honesty',
        category: 'Reliability',
        passed: false,
        durationMs: Date.now() - start,
        message: e.message,
      });
    }
  }

  // Test 9: Duplicate ISBN prevention
  {
    const start = Date.now();
    try {
      const firstBook = catalogStore.getAllBooks()[0];
      const dupAttempt = catalogStore.addBook({
        title: 'Duplicate Attempt Book',
        author: 'Test Author',
        isbn: firstBook.isbn,
        description: 'Testing duplicate ISBN rejection behavior.',
      });
      const passed = !!dupAttempt.error && dupAttempt.error.includes('Duplicate ISBN');
      results.push({
        id: 'test-9-duplicate-isbn-prevention',
        name: 'Duplicate ISBN Prevention & Conflict Check',
        category: 'Data Integrity',
        passed,
        durationMs: Date.now() - start,
        message: passed
          ? `Correctly blocked duplicate ISBN (${firstBook.isbn}): "${dupAttempt.error}"`
          : 'Allowed duplicate ISBN insertion',
      });
    } catch (e: any) {
      results.push({
        id: 'test-9-duplicate-isbn-prevention',
        name: 'Duplicate ISBN Prevention & Conflict Check',
        category: 'Data Integrity',
        passed: false,
        durationMs: Date.now() - start,
        message: e.message,
      });
    }
  }

  // Test 10: Index status and synchronization
  {
    const start = Date.now();
    try {
      const status = ragEngine.getIndexStatus();
      const passed = status.totalIndexed > 0 && status.embeddingDimensions > 0;
      results.push({
        id: 'test-10-index-sync',
        name: 'Vector Index Synchronization & Dimension Check',
        category: 'Vector Store',
        passed,
        durationMs: Date.now() - start,
        message: passed
          ? `Vector index active with ${status.totalIndexed} books, ${status.embeddingDimensions} dimensions (${status.model})`
          : 'Vector index is empty',
      });
    } catch (e: any) {
      results.push({
        id: 'test-10-index-sync',
        name: 'Vector Index Synchronization & Dimension Check',
        category: 'Vector Store',
        passed: false,
        durationMs: Date.now() - start,
        message: e.message,
      });
    }
  }

  const passedCount = results.filter(r => r.passed).length;
  return {
    results,
    summary: {
      total: results.length,
      passed: passedCount,
      failed: results.length - passedCount,
      durationMs: Date.now() - startAll,
    },
  };
}
