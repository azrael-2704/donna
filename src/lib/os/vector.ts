import { Pinecone } from '@pinecone-database/pinecone';

const PINECONE_API_KEY = process.env.PINECONE_API_KEY || '';
const PINECONE_INDEX = process.env.PINECONE_INDEX || 'donna-scripts';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// Initialize Pinecone lazily
let pc: Pinecone | null = null;
if (PINECONE_API_KEY) {
  try {
    pc = new Pinecone({ apiKey: PINECONE_API_KEY });
  } catch (err) {
    console.error('Pinecone init error:', err);
  }
}

export interface ScriptMetadata {
  id: string;
  goal_description: string;
  tags: string[];
  parameters_required: string[];
  command: string;
  cwd: string;
}

/**
 * Generate a 768-dimensional vector using Gemini text-embedding-004
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  const payload = {
    model: 'models/text-embedding-004',
    content: { parts: [{ text }] }
  };

  const res = await fetch(`${GEMINI_API_BASE}/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Embedding failed: ${err}`);
  }

  const data = await res.json();
  return data.embedding.values;
}

/**
 * Search the Global Vector Library for a pre-approved script
 */
export async function searchScriptLibrary(goal: string, threshold = 0.85): Promise<ScriptMetadata | null> {
  if (!pc) return null; // Graceful fallback if Pinecone is not configured

  try {
    const vector = await generateEmbedding(goal);
    const index = pc.index(PINECONE_INDEX);
    
    const queryResponse = await index.query({
      vector,
      topK: 1,
      includeMetadata: true
    });

    if (queryResponse.matches && queryResponse.matches.length > 0) {
      const match = queryResponse.matches[0];
      if (match.score && match.score >= threshold) {
        return match.metadata as unknown as ScriptMetadata;
      }
    }
    
    return null;
  } catch (err) {
    console.error('[VectorDB] Search Error:', err);
    return null;
  }
}

/**
 * Save a successfully executed script to the Global Vector Library
 */
export async function saveScriptToLibrary(metadata: ScriptMetadata): Promise<void> {
  if (!pc) return; // Graceful fallback

  try {
    const vector = await generateEmbedding(metadata.goal_description);
    const index = pc.index(PINECONE_INDEX);

    await index.upsert([{
      id: metadata.id,
      values: vector,
      metadata: {
        goal_description: metadata.goal_description,
        tags: metadata.tags,
        parameters_required: metadata.parameters_required,
        command: metadata.command,
        cwd: metadata.cwd
      }
    }] as any);

    console.log(`[VectorDB] Successfully upserted script: ${metadata.id}`);
  } catch (err) {
    console.error('[VectorDB] Upsert Error:', err);
  }
}
