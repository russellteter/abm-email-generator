'use client';

import { useState, useCallback, useEffect } from 'react';
import type { EmailSequence } from '@/lib/email-generator';

interface SaveButtonProps {
  accountIndex: number;
  accountName: string;
  contactId: string;
  contactName: string;
  contactTitle: string;
  emails: EmailSequence;
  onSaved?: (id: string) => void;
}

/**
 * SaveButton component
 *
 * Saves email sequence to the storage API.
 * Shows loading state during save, success confirmation briefly after save.
 */
export default function SaveButton({
  accountIndex,
  accountName,
  contactId,
  contactName,
  contactTitle,
  emails,
  onSaved,
}: SaveButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Reset status after showing success/error
  useEffect(() => {
    if (status === 'success' || status === 'error') {
      const timer = setTimeout(() => setStatus('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleSave = useCallback(async () => {
    setIsLoading(true);
    setStatus('idle');

    try {
      const response = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountIndex,
          accountName,
          contactId,
          contactName,
          contactTitle,
          emails,
        }),
      });

      if (!response.ok) {
        throw new Error('Save failed');
      }

      const saved = await response.json();
      setStatus('success');
      onSaved?.(saved.id);
    } catch (err) {
      console.error('Save failed:', err);
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  }, [accountIndex, accountName, contactId, contactName, contactTitle, emails, onSaved]);

  const getButtonStyles = () => {
    if (status === 'error') {
      return 'bg-red-500 text-white';
    }
    if (status === 'success') {
      return 'bg-green-500 text-white';
    }
    if (isLoading) {
      return 'cursor-wait bg-class-navy/70 text-white';
    }
    return 'bg-class-navy text-white hover:bg-class-navy/90';
  };

  return (
    <button
      type="button"
      onClick={handleSave}
      disabled={isLoading || status === 'success'}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${getButtonStyles()}`}
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
          Saving...
        </>
      ) : status === 'success' ? (
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
              d="M5 13l4 4L19 7"
            />
          </svg>
          Saved!
        </>
      ) : status === 'error' ? (
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
          Save Failed
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
              d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
            />
          </svg>
          Save
        </>
      )}
    </button>
  );
}
