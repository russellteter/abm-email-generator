/**
 * Browser download utility for Word documents
 *
 * Handles converting Document objects to blobs and triggering browser downloads.
 * CRITICAL: downloadDocument must be called within onClick handler's synchronous
 * call stack to avoid browser download blocking.
 */

import { Packer } from 'docx';
import type { Document } from 'docx';
import { saveAs } from 'file-saver';

/**
 * Downloads a Word document to the user's computer
 *
 * @param doc - Document object from docx library
 * @param filename - Filename without extension (e.g., "john-doe-emails")
 */
export async function downloadDocument(
  doc: Document,
  filename: string
): Promise<void> {
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${filename}.docx`);
}

/**
 * Sanitizes a string for use as a filename
 * Converts to lowercase, replaces spaces with dashes, removes special characters
 *
 * @param name - Raw string to sanitize
 * @returns Clean filename-safe string
 */
export function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}
