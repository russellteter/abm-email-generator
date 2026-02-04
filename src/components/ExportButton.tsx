'use client';

import { useState, useCallback } from 'react';
import { createEmailDocument } from '@/lib/export/word-generator';
import { downloadDocument, sanitizeFilename } from '@/lib/export/download';
import type { EmailSequence } from '@/lib/email-generator';

interface ExportButtonProps {
  contactId: string;
  contactName: string;
  contactTitle: string;
  accountName: string;
  emails: EmailSequence;
}

/**
 * ExportButton component
 *
 * Handles the full export flow: creates Word document from email sequence
 * and triggers browser download. Shows loading state during export.
 */
export default function ExportButton({
  contactId,
  contactName,
  contactTitle,
  accountName,
  emails,
}: ExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Create Word document
      const doc = createEmailDocument(contactName, contactTitle, accountName, emails);

      // Generate sanitized filename and trigger download
      const filename = `${sanitizeFilename(contactName)}-emails`;
      await downloadDocument(doc, filename);
    } catch (err) {
      console.error('Export failed:', err);
      setError('Export failed');
      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
    }
  }, [contactName, contactTitle, accountName, emails]);

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isLoading}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
        error
          ? 'bg-red-500 text-white'
          : isLoading
            ? 'cursor-wait bg-class-purple/70 text-white'
            : 'bg-class-purple text-white hover:bg-class-purple/90'
      }`}
    >
      {isLoading ? (
        <>
          <svg
            className="h-4 w-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Exporting...
        </>
      ) : error ? (
        <>
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Export Failed
        </>
      ) : (
        <>
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Export to Word
        </>
      )}
    </button>
  );
}
