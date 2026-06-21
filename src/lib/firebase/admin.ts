import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

if (!getApps().length) {
  try {
    let serviceAccount = null;

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        if (parsed.private_key) {
          serviceAccount = parsed;
          serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }
      } catch (e) {
        console.warn('Could not parse FIREBASE_SERVICE_ACCOUNT env var.');
      }
    }

    if (!serviceAccount && process.env.NODE_ENV !== 'production') {
      try {
        const localPath = path.join(process.cwd(), 'firebase-adminsdk.json');
        if (fs.existsSync(localPath)) {
          const fileContent = fs.readFileSync(localPath, 'utf8');
          serviceAccount = JSON.parse(fileContent);
          if (serviceAccount.private_key) {
             serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
          }
        }
      } catch (e) {}
    }

    if (serviceAccount) {
      initializeApp({
        credential: cert(serviceAccount)
      });
    } else {
      initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'dummy-project'
      });
      console.warn('Firebase Admin initialized without explicit credentials.');
    }
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

const adminDb = getFirestore();
export { adminDb };
