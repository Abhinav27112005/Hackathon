import { GoogleGenerativeAI } from '@google/generative-ai';

// ──────────────────────────────────────
// WHAT IS GEMINI CLIENT?
//
// Google's Gemini provides APIs for:
// 1. Chat/Text Generation (gemini-2.5-flash) → For answering questions, eligibility checks
// 2. Embeddings (gemini-embedding-001) → For converting text to number vectors
//
// We use BOTH in our project:
// - Embeddings: During PDF processing (convert chunks to vectors)
// - Chat: During eligibility checking (compare profile vs rules)
//
// WHY CREATE A SHARED CLIENT?
// Instead of creating 'new GoogleGenerativeAI()' in every file,
// we create it once here and import it everywhere.
// This ensures consistent configuration and avoids duplication.
//
// SETUP:
// 1. Go to aistudio.google.com
// 2. Click "Get API Key"
// 3. Add to .env as GEMINI_API_KEY
//
// COST AWARENESS (Gemini FREE tier):
// - Embeddings (gemini-embedding-001): FREE (1500 requests/day)
// - Chat (gemini-2.5-flash): FREE (15 requests/min, 1500/day)
// - Gemini is FREE for development = perfect for hackathon!
//
// COMPARISON WITH OPENAI:
// ┌─────────────────────┬────────────────┬─────────────────┐
// │     Feature         │  OpenAI        │  Gemini         │
// ├─────────────────────┼────────────────┼─────────────────┤
// │ Embedding Model     │ ada-002        │ embedding-001   │
// │ Embedding Dims      │ 1536           │ 3072            │
// │ Chat Model          │ gpt-3.5-turbo  │ gemini-2.5-flash│
// │ Free Tier           │ $5 credit      │ Generous free!  │
// │ Embedding Cost      │ $0.0001/1K tok │ FREE            │
// └─────────────────────┴────────────────┴─────────────────┘
// ──────────────────────────────────────

// ── Verify API key exists ──
if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  GEMINI_API_KEY not set in .env');
}

// ── Create the shared Gemini client ──
// This is the main entry point. All models are created from this.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ── 1. Chat Model (For eligibility checking, Q&A) ──
// gemini-2.5-flash: Fast, smart, and FREE
// Used in: ragService.ts → eligibility checking
export const chatModel = genAI.getGenerativeModel({
    model: "gemini-2.5-flash"
});

// ── 2. Embedding Model (For RAG/Vector Search) ──
// gemini-embedding-001: Outputs 3072-dimension vectors
// Used in: pdfProcessingService.ts → generating chunk embeddings
//          ragService.ts → generating query embeddings for search
//
// IMPORTANT: The SAME model must be used for both:
//   - Storing embeddings (during PDF processing)
//   - Searching embeddings (during RAG query)
// Different models produce DIFFERENT vector spaces!
export const embeddingModel = genAI.getGenerativeModel({
    model: "gemini-embedding-001"
});

console.log('✨ Gemini AI client configured');

// Export the raw client too (for cases needing custom model config)
export default genAI;
