import { Book, RecommendationRequest, RecommendationItem } from '../src/types/book.js';
import { catalogStore } from './catalogStore.js';
import { ragEngine } from './ragEngine.js';
import { embedText, cosineSimilarity } from './geminiClient.js';

export class RecommendationEngine {
  public async getRecommendations(req: RecommendationRequest): Promise<{
    recommendations: RecommendationItem[];
    reasoningSummary: string;
    targetBook?: Book;
    suggestedFollowUps: string[];
  }> {
    const allBooks = catalogStore.getAllBooks();
    const count = req.count || 6;
    const items: RecommendationItem[] = [];

    let targetBook: Book | undefined;
    if (req.targetBookId) {
      targetBook = catalogStore.getBookById(req.targetBookId);
    }

    // Identify user preference terms
    const preferredGenres = (req.preferredGenres || []).map(g => g.toLowerCase());
    const userInterests = (req.userInterests || []).map(i => i.toLowerCase());
    const favoriteAuthors = (req.favoriteAuthors || []).map(a => a.toLowerCase());
    const favoriteBookIds = new Set(req.favoriteBookIds || []);
    const readingLevel = req.readingLevel;

    // Check if target book is unavailable, so we specifically look for alternatives
    const isTargetUnavailable = targetBook ? (!targetBook.available || targetBook.availableCopies <= 0) : false;

    // Construct a synthetic preference profile text for semantic matching
    const profileParts: string[] = [];
    if (targetBook) {
      profileParts.push(`Similar to: ${targetBook.title} by ${targetBook.author}. Category: ${targetBook.category}. Description: ${targetBook.description}`);
    }
    if (preferredGenres.length > 0) {
      profileParts.push(`Genres: ${preferredGenres.join(', ')}`);
    }
    if (userInterests.length > 0) {
      profileParts.push(`Interests: ${userInterests.join(', ')}`);
    }
    if (favoriteAuthors.length > 0) {
      profileParts.push(`Authors: ${favoriteAuthors.join(', ')}`);
    }
    if (readingLevel) {
      profileParts.push(`Target Reading Level: ${readingLevel}`);
    }

    const profileText = profileParts.join('. ');

    let profileEmbedding: number[] | null = null;
    if (profileText.trim().length > 0) {
      try {
        profileEmbedding = await embedText(profileText);
      } catch (err) {
        console.warn('Embedding error during recommendations:', err);
      }
    }

    for (const book of allBooks) {
      // Don't recommend the target book itself if looking for similar books
      if (targetBook && book.id === targetBook.id) continue;
      // Don't recommend books already in user's favorite book list unless empty catalog
      if (favoriteBookIds.has(book.id) && allBooks.length > favoriteBookIds.size + 3) continue;

      let score = 50; // base score
      const matchingFactors: string[] = [];

      // Constraint Check: Reading Level
      if (readingLevel && readingLevel !== 'All Levels') {
        if (book.readingLevel === readingLevel) {
          score += 15;
          matchingFactors.push(`Matches your ${readingLevel} reading level`);
        } else if (readingLevel === 'Beginner' && book.readingLevel === 'Advanced') {
          // Penalize advanced when user strictly asks for beginner
          score -= 30;
        }
      }

      // Genre match
      if (preferredGenres.length > 0) {
        if (preferredGenres.includes(book.category.toLowerCase())) {
          score += 25;
          matchingFactors.push(`In your preferred genre: ${book.category}`);
        }
      }

      // Target book category match
      if (targetBook && book.category.toLowerCase() === targetBook.category.toLowerCase()) {
        score += 20;
        matchingFactors.push(`Shares category with "${targetBook.title}"`);
      }

      // Author match
      if (favoriteAuthors.some(fa => book.author.toLowerCase().includes(fa))) {
        score += 25;
        matchingFactors.push(`By favorite author ${book.author}`);
      }

      // Target book author match
      if (targetBook && book.author.toLowerCase() === targetBook.author.toLowerCase()) {
        score += 30;
        matchingFactors.push(`Also written by ${targetBook.author}`);
      }

      // User interests match (keywords/tags)
      const bookText = `${book.title} ${book.description} ${book.tags.join(' ')}`.toLowerCase();
      userInterests.forEach(interest => {
        if (bookText.includes(interest)) {
          score += 15;
          matchingFactors.push(`Covers ${interest}`);
        }
      });

      // Semantic Similarity
      if (profileEmbedding) {
        try {
          const bookDoc = ragEngine.prepareDocumentChunk(book);
          const bookEmbedding = await embedText(bookDoc);
          const sim = cosineSimilarity(profileEmbedding, bookEmbedding);
          score += Math.max(0, sim * 30);
        } catch (err) {
          // ignore
        }
      }

      // Availability boost / alternative flag
      const isAlternative = isTargetUnavailable && book.available && book.category === targetBook?.category;
      if (isAlternative) {
        score += 20;
        matchingFactors.push(`✅ Available right now as alternative to checked-out "${targetBook?.title}"`);
      } else if (book.available && book.availableCopies > 0) {
        score += 5;
      }

      // High library rating boost
      if (book.rating && book.rating >= 4.7) {
        score += 5;
      }

      // Normalization
      const finalScore = Math.min(99, Math.max(20, Math.round(score)));

      let explanation = '';
      if (isAlternative) {
        explanation = `Recommended as an immediately available alternative for "${targetBook?.title}". Covers comparable themes with ${book.availableCopies} copy available on shelf ${book.shelfLocation}.`;
      } else if (matchingFactors.length > 0) {
        explanation = `Recommended because it ${matchingFactors.slice(0, 2).map(f => f.toLowerCase()).join(' and ')}.`;
      } else {
        explanation = `High-rated ${book.category} title frequently recommended for readers in our library collection.`;
      }

      items.push({
        book,
        matchScore: finalScore,
        explanation,
        matchingFactors,
        isAlternativeForUnavailable: isAlternative,
        alternativeForTitle: isAlternative ? targetBook?.title : undefined,
      });
    }

    // Sort by matchScore descending
    items.sort((a, b) => b.matchScore - a.matchScore);

    const topRecommendations = items.slice(0, count);

    const reasoningSummary = targetBook
      ? `Based on "${targetBook.title}" (${targetBook.category})${isTargetUnavailable ? ', and prioritizing available library copies since the original title is checked out' : ''}.`
      : preferredGenres.length > 0 || userInterests.length > 0
      ? `Curated based on your interests in ${[...preferredGenres, ...userInterests].slice(0, 3).join(', ')}${readingLevel ? ` at ${readingLevel} level` : ''}.`
      : 'Top curated selections from our diverse library collection across Computer Science, AI, Science, and Literature.';

    const suggestedFollowUps = [
      'Which of these recommendations has the shortest reading time?',
      'Can you explain the main difference between these titles?',
      'Are there any other books available on this shelf?',
    ];

    return {
      recommendations: topRecommendations,
      reasoningSummary,
      targetBook,
      suggestedFollowUps,
    };
  }
}

export const recommendationEngine = new RecommendationEngine();
