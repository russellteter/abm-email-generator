'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { AccountListItem, ContactListItem, Account, Contact } from '@/lib/types';
import type { EmailSequence, AccountInput, ContactInput } from '@/lib/email-generator';

interface EmailGeneratorProps {
  account: AccountListItem;
  contacts: ContactListItem[];
  fullAccountData: Account | null;
  fullContactsData: Contact[];
  onEmailsGenerated: (emails: Map<string, EmailSequence>) => void;
}

interface GenerationStatus {
  contactId: string;
  contactName: string;
  status: 'pending' | 'generating' | 'complete' | 'error';
  error?: string;
}

/**
 * EmailGenerator component
 *
 * Handles email generation for selected contacts using the streaming API.
 * Shows progress as emails are generated for each contact.
 */
export default function EmailGenerator({
  account,
  contacts,
  fullAccountData,
  fullContactsData,
  onEmailsGenerated,
}: EmailGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [statuses, setStatuses] = useState<GenerationStatus[]>([]);
  const [generatedEmails, setGeneratedEmails] = useState<Map<string, EmailSequence>>(new Map());
  const [error, setError] = useState<string | null>(null);

  // Track previous account to detect account changes
  const prevAccountRef = useRef<number | null>(null);

  // Clear error/status state when account changes (UAT-004 fix)
  useEffect(() => {
    if (prevAccountRef.current !== null && prevAccountRef.current !== account.index) {
      // Account changed - clear previous generation state
      setStatuses([]);
      setError(null);
    }
    prevAccountRef.current = account.index;
  }, [account.index]);

  /**
   * Build AccountInput from available data
   */
  const buildAccountInput = useCallback((): AccountInput => {
    if (fullAccountData) {
      return {
        index: fullAccountData.index,
        company_name: fullAccountData.company_name,
        tier: fullAccountData.tier,
        ehr_system: fullAccountData.ehr_system,
        employee_count: fullAccountData.employee_count,
        timing_signals: fullAccountData.timing_signals,
        ehr_go_live_date: fullAccountData.ehr_go_live_date,
        key_timing_signals: fullAccountData.key_timing_signals,
        qualification_summary: fullAccountData.qualification_summary,
        evidence_summary: fullAccountData.evidence_summary,
        news_summary: fullAccountData.news_summary,
      };
    }

    // Fallback to list item data if full data not available
    return {
      index: account.index,
      company_name: account.company_name,
      tier: account.tier,
      ehr_system: account.ehr_system,
      employee_count: account.employee_count,
    };
  }, [account, fullAccountData]);

  /**
   * Build ContactInput from contact data
   */
  const buildContactInput = useCallback((contactListItem: ContactListItem): ContactInput => {
    // Find full contact data if available
    const fullContact = fullContactsData.find(c => c.contact_id === contactListItem.contact_id);

    if (fullContact) {
      return {
        contact_id: fullContact.contact_id,
        full_name: fullContact.full_name,
        first_name: fullContact.first_name,
        title: fullContact.title,
        email: fullContact.email,
        persona_match: fullContact.persona_match,
        department: fullContact.department,
        relevance_notes: fullContact.relevance_notes,
      };
    }

    // Fallback to list item data
    return {
      contact_id: contactListItem.contact_id,
      full_name: contactListItem.full_name,
      first_name: contactListItem.full_name.split(' ')[0],
      title: contactListItem.title,
      email: contactListItem.email,
      persona_match: contactListItem.persona_match,
    };
  }, [fullContactsData]);

  /**
   * Generate emails for a single contact
   */
  const generateForContact = useCallback(async (
    contactListItem: ContactListItem,
    accountInput: AccountInput
  ): Promise<EmailSequence | null> => {
    const contactInput = buildContactInput(contactListItem);

    const response = await fetch('/api/generate-emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        account: accountInput,
        contact: contactInput,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      // Show detailed error including API billing issues
      const errorMessage = errorData.details || errorData.error || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }

    // Stream and accumulate the response
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let accumulated = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      accumulated += decoder.decode(value, { stream: true });
    }

    // Parse the complete JSON response
    try {
      // The streamed response should be valid JSON array
      const emails = JSON.parse(accumulated) as EmailSequence;
      return emails;
    } catch {
      // Claude often adds markdown code blocks or explanatory text
      // Try multiple extraction strategies

      // Strategy 1: Extract from markdown code block ```json ... ```
      const codeBlockMatch = accumulated.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        try {
          return JSON.parse(codeBlockMatch[1].trim()) as EmailSequence;
        } catch {
          // Continue to next strategy
        }
      }

      // Strategy 2: Find JSON array pattern anywhere in response
      const jsonMatch = accumulated.match(/\[\s*\{[\s\S]*?\}\s*\]/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]) as EmailSequence;
        } catch {
          // Continue to next strategy
        }
      }

      // Strategy 3: Find from first [ to last ]
      const firstBracket = accumulated.indexOf('[');
      const lastBracket = accumulated.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket > firstBracket) {
        try {
          const jsonStr = accumulated.slice(firstBracket, lastBracket + 1);
          return JSON.parse(jsonStr) as EmailSequence;
        } catch {
          // All strategies failed
        }
      }

      console.error('Failed to parse response:', accumulated.slice(0, 500));
      throw new Error('Failed to parse email sequence from response');
    }
  }, [buildContactInput]);

  /**
   * Generate emails for all selected contacts
   */
  const handleGenerate = useCallback(async () => {
    if (contacts.length === 0) return;

    setIsGenerating(true);
    setError(null);
    setStatuses([]); // Clear previous statuses/errors
    setGeneratedEmails(new Map());

    // Initialize statuses for all contacts
    const initialStatuses: GenerationStatus[] = contacts.map(c => ({
      contactId: c.contact_id,
      contactName: c.full_name,
      status: 'pending',
    }));
    setStatuses(initialStatuses);

    const accountInput = buildAccountInput();
    const results = new Map<string, EmailSequence>();

    // Generate emails sequentially (one contact at a time)
    for (const contact of contacts) {
      // Update status to generating
      setStatuses(prev => prev.map(s =>
        s.contactId === contact.contact_id
          ? { ...s, status: 'generating' }
          : s
      ));

      try {
        const emails = await generateForContact(contact, accountInput);
        if (emails) {
          results.set(contact.contact_id, emails);
          setGeneratedEmails(new Map(results));
        }

        // Update status to complete
        setStatuses(prev => prev.map(s =>
          s.contactId === contact.contact_id
            ? { ...s, status: 'complete' }
            : s
        ));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Generation failed';

        // Update status to error
        setStatuses(prev => prev.map(s =>
          s.contactId === contact.contact_id
            ? { ...s, status: 'error', error: errorMessage }
            : s
        ));
      }
    }

    setIsGenerating(false);
    onEmailsGenerated(results);
  }, [contacts, buildAccountInput, generateForContact, onEmailsGenerated]);

  // Calculate progress
  const completedCount = statuses.filter(s => s.status === 'complete').length;
  const errorCount = statuses.filter(s => s.status === 'error').length;
  const currentlyGenerating = statuses.find(s => s.status === 'generating');

  return (
    <div className="space-y-4">
      {/* Generate Button and Status */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-class-navy">Ready to Generate</h3>
          <p className="mt-1 text-sm text-class-navy/70">
            {contacts.length > 0
              ? `${contacts.length} contact${contacts.length === 1 ? '' : 's'} selected for email generation`
              : 'Select at least one contact to generate emails'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={contacts.length === 0 || isGenerating}
          className="rounded-lg bg-class-purple px-6 py-2 text-white transition-colors hover:bg-class-purple/90 disabled:cursor-not-allowed disabled:bg-class-navy/20 disabled:text-class-navy/40"
        >
          {isGenerating ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Generating...
            </span>
          ) : (
            'Generate Emails'
          )}
        </button>
      </div>

      {/* Progress Display */}
      {statuses.length > 0 && (
        <div className="rounded-lg border border-class-light-purple bg-class-light-purple/20 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-class-navy">
              Progress: {completedCount}/{contacts.length} contacts
              {errorCount > 0 && ` (${errorCount} failed)`}
            </span>
            {isGenerating && currentlyGenerating && (
              <span className="text-sm text-class-purple">
                Generating for {currentlyGenerating.contactName}...
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="h-2 overflow-hidden rounded-full bg-class-navy/10">
            <div
              className="h-full bg-class-purple transition-all duration-300"
              style={{ width: `${(completedCount / contacts.length) * 100}%` }}
            />
          </div>

          {/* Contact Status List */}
          <div className="mt-3 space-y-1">
            {statuses.map(status => (
              <div
                key={status.contactId}
                className="flex items-center gap-2 text-sm"
              >
                {status.status === 'pending' && (
                  <span className="h-2 w-2 rounded-full bg-class-navy/30" />
                )}
                {status.status === 'generating' && (
                  <span className="h-2 w-2 animate-pulse rounded-full bg-class-purple" />
                )}
                {status.status === 'complete' && (
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                )}
                {status.status === 'error' && (
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                )}
                <span className={status.status === 'generating' ? 'font-medium text-class-purple' : 'text-class-navy/70'}>
                  {status.contactName}
                </span>
                {status.error && (
                  <span className="text-red-500">- {status.error}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Generation Complete Message */}
      {!isGenerating && completedCount > 0 && completedCount === contacts.length - errorCount && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-green-700">
            Successfully generated emails for {completedCount} contact{completedCount === 1 ? '' : 's'}.
            {errorCount > 0 && ` ${errorCount} failed.`}
          </p>
        </div>
      )}
    </div>
  );
}
