/**
 * File-based storage for saved email sequences
 *
 * Uses a JSON file for persistence during development.
 * This ensures data survives page reloads and module recompilations.
 * For production, consider Vercel KV or database storage.
 */

import type { SavedEmail, SavedEmailMetadata } from './types';
import type { EmailSequence } from './email-generator/schemas';
import * as fs from 'fs';
import * as path from 'path';

// Storage file path - in data directory for persistence
const STORAGE_FILE = path.join(process.cwd(), 'data', 'saved-emails.json');

// In-memory cache backed by file storage
let emailStore: Map<string, SavedEmail> | null = null;

/**
 * Load emails from file storage
 */
function loadFromFile(): Map<string, SavedEmail> {
  if (emailStore !== null) {
    return emailStore;
  }

  emailStore = new Map<string, SavedEmail>();

  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf-8');
      const parsed = JSON.parse(data) as Record<string, SavedEmail>;
      for (const [id, email] of Object.entries(parsed)) {
        emailStore.set(id, email);
      }
    }
  } catch (error) {
    console.error('Failed to load saved emails:', error);
  }

  return emailStore;
}

/**
 * Save emails to file storage
 */
function saveToFile(): void {
  const store = loadFromFile();
  const data: Record<string, SavedEmail> = {};
  for (const [id, email] of store.entries()) {
    data[id] = email;
  }

  try {
    // Ensure directory exists
    const dir = path.dirname(STORAGE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Failed to save emails to file:', error);
  }
}

/**
 * Input data for saving a new email sequence
 */
export interface SaveEmailInput {
  accountIndex: number;
  accountName: string;
  contactId: string;
  contactName: string;
  contactTitle: string;
  emails: EmailSequence;
}

/**
 * Save a new email sequence
 * @returns The saved email with generated ID and timestamps
 */
export function saveEmail(data: SaveEmailInput): SavedEmail {
  const store = loadFromFile();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const saved: SavedEmail = {
    id,
    accountIndex: data.accountIndex,
    accountName: data.accountName,
    contactId: data.contactId,
    contactName: data.contactName,
    contactTitle: data.contactTitle,
    emails: data.emails,
    createdAt: now,
    updatedAt: now,
  };

  store.set(id, saved);
  saveToFile();
  return saved;
}

/**
 * Get a saved email by ID
 * @returns The saved email or null if not found
 */
export function getEmail(id: string): SavedEmail | null {
  const store = loadFromFile();
  return store.get(id) ?? null;
}

/**
 * List all saved emails, optionally filtered by account
 * @param accountIndex - Optional filter by account index
 * @returns Array of saved email metadata (without full email content)
 */
export function listEmails(accountIndex?: number): SavedEmailMetadata[] {
  const store = loadFromFile();
  const emails = Array.from(store.values());

  // Filter by account if specified
  const filtered = accountIndex !== undefined
    ? emails.filter((e) => e.accountIndex === accountIndex)
    : emails;

  // Convert to metadata (without full email content)
  return filtered.map((e) => ({
    id: e.id,
    accountIndex: e.accountIndex,
    accountName: e.accountName,
    contactId: e.contactId,
    contactName: e.contactName,
    contactTitle: e.contactTitle,
    emailCount: e.emails.length,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  }));
}

/**
 * Delete a saved email by ID
 * @returns true if deleted, false if not found
 */
export function deleteEmail(id: string): boolean {
  const store = loadFromFile();
  const deleted = store.delete(id);
  if (deleted) {
    saveToFile();
  }
  return deleted;
}

/**
 * Get the count of saved emails
 */
export function getEmailCount(): number {
  const store = loadFromFile();
  return store.size;
}

/**
 * Clear all saved emails (useful for testing)
 */
export function clearAllEmails(): void {
  emailStore = new Map();
  saveToFile();
}
