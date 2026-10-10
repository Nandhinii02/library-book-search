# Smart Library AI – Book Search and Recommendation Agent

An intelligent library assistant and catalog management platform utilizing **Large Language Models (LLM)** and **Retrieval-Augmented Generation (RAG)** to provide grounded semantic search, personalized reading recommendations, and conversational catalog Q&A.

---

## Key Features

### 1. AI-Powered Natural Language Search
- Semantic understanding of intent (e.g., *"Find beginner-friendly Python programming books"*, *"Show me books about artificial intelligence published after 2020"*).
- Multi-modal hybrid retrieval combining dense vector similarity with exact keyword/ISBN matching.
- Real-time catalog filtering by genre, reading level, publication year, language, and immediate library availability.
- Dynamic sorting by relevance, publication year, rating, or title.

### 2. AI Book Recommendation Agent
- Multi-factor preference matching across preferred genres, reading levels, favorite authors, and topics.
- Content-based recommendations with natural-language justifications (*"Why this was recommended"*).
- **Unavailable Book Alternative Engine**: Detects when a requested title is checked out (0 physical copies available) and immediately proposes in-stock library alternatives on the same shelf or subject.
- Reader actions to like, save to reading list, or dismiss recommendations.

### 3. Complete 6-Step RAG Architecture
1. **Data Ingestion**: Canonical book management with schema validation, year boundaries, and duplicate ISBN detection.
2. **Document Preparation**: Structured document chunk generation combining title, author, category, publication date, reading level, and full description.
3. **Embedding Generation**: Powered by Google Gemini `gemini-embedding-2-preview` on server side with deterministic local vectorizer fallback.
4. **Vector Storage**: File-backed vector index with cosine similarity calculation and asynchronous background re-indexing.
5. **Retrieval**: Query embedding generation + cosine similarity + lexical BM25/keyword scoring with hard metadata constraints.
6. **Grounded LLM Generation**: Model prompt instructions grounded strictly in catalog records using `gemini-3.8-flash`. Prevents hallucinated titles, ISBNs, shelf locations, or false availability claims.

### 4. Conversational Library Assistant
- Multi-turn conversational interface with contextual follow-up awareness.
- Inline grounded book cards inside the conversation feed.
- Dynamic suggested follow-up query pills.
- Persistent floating assistant drawer accessible across the entire application.

### 5. Staff Administration & Evaluation Portal
- Protected staff console (default passcode: `admin123`).
- Live catalog inventory CRUD with real-time copy check-in/check-out simulation.
- Batch CSV / JSON catalog import with validation reports.
- Export catalog as JSON or CSV.
- Vector index status inspection and manual index rebuild.
- **Automated 10-Area Evaluation Suite**: One-click test runner testing ingestion validation, semantic search, metadata filters, recommendation relevance, answer grounding, conflicting info handling, unavailable books, empty search honesty, duplicate ISBN rejection, and vector sync.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons
- **Backend**: Express (Node.js/TSX) with Vite middleware
- **LLM**: Google Gemini API (`@google/genai` TypeScript SDK, `gemini-3.8-flash`)
- **Embeddings**: Google Gemini Embedding (`gemini-embedding-2-preview`) with normalized local TF-IDF fallback
- **Vector Storage**: In-memory + persistent JSON vector index with cosine similarity
- **Catalog Database**: File-backed JSON store with transaction safety and seed data of 25 curated library books

---

## Environment Configuration

Create a `.env` file based on `.env.example`:

```bash
# Gemini API Key (injected automatically in Google AI Studio)
GEMINI_API_KEY="your-gemini-api-key"

# Staff portal passcode (default: admin123)
ADMIN_PASSCODE="admin123"

# Port (default 3000)
PORT=3000
```

---

## Running the Application

### Development Mode
```bash
npm install
npm run dev
```
The server will start on `http://localhost:3000`.

### Building for Production
```bash
npm run build
npm start
```

### Running Automated Test Suite
From the Staff Portal, click the **Automated RAG Tests** tab and press **Run All 10 Test Suites**, or call via API:
```bash
curl -X POST http://localhost:3000/api/admin/run-tests \
  -H "x-admin-key: admin123"
```
