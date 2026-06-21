import { adminDb } from '@/lib/firebase/admin';

export interface VaultNode {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

/**
 * Fetches all Markdown nodes for a user and serializes them into a single context string.
 */
export async function readVaultGraph(userId: string): Promise<string> {
  if (!userId) return '';
  
  try {
    const snapshot = await adminDb
      .collection('users')
      .doc(userId)
      .collection('vault_nodes')
      .get();

    if (snapshot.empty) {
      return 'No memory nodes found.';
    }

    let graphContext = '--- MEMORY VAULT START ---\n\n';
    
    snapshot.forEach(doc => {
      const data = doc.data();
      graphContext += `## ${data.title || doc.id}\n${data.content}\n\n`;
    });

    graphContext += '--- MEMORY VAULT END ---\n';
    return graphContext;
  } catch (error) {
    console.error('[memory] Error reading vault:', error);
    return 'Error reading memory vault.';
  }
}

/**
 * Creates or updates a Markdown node in Firestore.
 */
export async function updateGraphNode(userId: string, title: string, content: string): Promise<void> {
  if (!userId || !title) throw new Error('Missing userId or title');

  // Sanitize title for document ID
  const docId = title.toLowerCase().replace(/[^a-z0-9]/g, '_');

  await adminDb
    .collection('users')
    .doc(userId)
    .collection('vault_nodes')
    .doc(docId)
    .set({
      title,
      content,
      updatedAt: new Date().toISOString()
    }, { merge: true });
}
