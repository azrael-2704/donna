import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const MASTER_KEY_PATH = path.join(process.cwd(), '.donna_master_key');
const ALGORITHM = 'aes-256-gcm';

/**
 * Initializes or retrieves the master encryption key.
 */
function getMasterKey(): Buffer {
  if (fs.existsSync(MASTER_KEY_PATH)) {
    const keyHex = fs.readFileSync(MASTER_KEY_PATH, 'utf-8').trim();
    return Buffer.from(keyHex, 'hex');
  }
  
  // Generate a new 32-byte master key
  const newKey = crypto.randomBytes(32);
  fs.writeFileSync(MASTER_KEY_PATH, newKey.toString('hex'), 'utf-8');
  console.log('[vault] Generated new master key.');
  return newKey;
}

/**
 * Encrypts a plaintext string.
 * Returns a string formatted as IV:AuthTag:EncryptedData (hex encoded).
 */
export function encryptValue(text: string): string {
  const key = getMasterKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a previously encrypted string.
 */
export function decryptValue(encryptedString: string): string {
  try {
    const key = getMasterKey();
    const parts = encryptedString.split(':');
    if (parts.length !== 3) throw new Error('Invalid encrypted string format');
    
    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (err) {
    console.error('[vault] Decryption failed:', err);
    throw new Error('Decryption failed. Master key may be invalid.');
  }
}

const SECRETS_PATH = path.join(process.cwd(), '.donna_secrets');

/**
 * Saves a secret securely in the local secrets file.
 */
export function saveSecret(key: string, value: string): void {
  let secrets: Record<string, string> = {};
  if (fs.existsSync(SECRETS_PATH)) {
    try {
      secrets = JSON.parse(fs.readFileSync(SECRETS_PATH, 'utf-8'));
    } catch {}
  }
  
  secrets[key] = encryptValue(value);
  fs.writeFileSync(SECRETS_PATH, JSON.stringify(secrets, null, 2), 'utf-8');
}

/**
 * Retrieves and decrypts a secret from the local secrets file.
 */
export function getSecret(key: string): string | null {
  if (!fs.existsSync(SECRETS_PATH)) return null;
  
  try {
    const secrets = JSON.parse(fs.readFileSync(SECRETS_PATH, 'utf-8'));
    if (!secrets[key]) return null;
    return decryptValue(secrets[key]);
  } catch {
    return null;
  }
}
