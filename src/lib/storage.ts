/**
 * In-memory storage for saved email sequences
 *
 * Uses a Map that survives between requests in the same server instance.
 * Note: Data will be lost on server restart or cold start (Vercel).
 * For persistent storage, Phase 10 can add database or Vercel KV.
 */

import type { SavedEmail, SavedEmailMetadata } from './types';
import type { EmailSequence } from './email-generator/schemas';

// In-memory storage - survives between requests in same instance
const emailStore = new Map<string, SavedEmail>();

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

  emailStore.set(id, saved);
  return saved;
}

/**
 * Get a saved email by ID
 * @returns The saved email or null if not found
 */
export function getEmail(id: string): SavedEmail | null {
  return emailStore.get(id) ?? null;
}

/**
 * List all saved emails, optionally filtered by account
 * @param accountIndex - Optional filter by account index
 * @returns Array of saved email metadata (without full email content)
 */
export function listEmails(accountIndex?: number): SavedEmailMetadata[] {
  const emails = Array.from(emailStore.values());

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
  return emailStore.delete(id);
}

/**
 * Get the count of saved emails
 */
export function getEmailCount(): number {
  return emailStore.size;
}

/**
 * Clear all saved emails (useful for testing)
 */
export function clearAllEmails(): void {
  emailStore.clear();
}
