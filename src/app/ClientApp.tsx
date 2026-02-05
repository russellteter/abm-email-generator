'use client';

import { useState, useCallback } from 'react';
import AccountSelector from '@/components/AccountSelector';
import AccountIntelligencePanel from '@/components/AccountIntelligencePanel';
import ContactSelector from '@/components/ContactSelector';
import EmailGenerator from '@/components/EmailGenerator';
import EmailSequenceDisplay from '@/components/EmailSequenceDisplay';
import EmailHistoryPanel from '@/components/EmailHistoryPanel';
import type { AccountListItem, ContactListItem, Account, Contact, SavedEmail } from '@/lib/types';
import type { EmailSequence } from '@/lib/email-generator';

interface ClientAppProps {
  accounts: AccountListItem[];
}

export default function ClientApp({ accounts }: ClientAppProps) {
  const [selectedAccountIndex, setSelectedAccountIndex] = useState<number | null>(null);
  const [contacts, setContacts] = useState<ContactListItem[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [contactsError, setContactsError] = useState<string | null>(null);

  // Full data for email generation
  const [fullAccountData, setFullAccountData] = useState<Account | null>(null);
  const [fullContactsData, setFullContactsData] = useState<Contact[]>([]);

  // Generated emails storage (Phase 5 will display these)
  const [generatedEmails, setGeneratedEmails] = useState<Map<string, EmailSequence>>(new Map());

  // Email history state
  const [showAllAccounts, setShowAllAccounts] = useState(false);
  const [viewingEmailId, setViewingEmailId] = useState<string | null>(null);
  const [viewingEmail, setViewingEmail] = useState<SavedEmail | null>(null);
  const [viewingEmailLoading, setViewingEmailLoading] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  const handleAccountSelect = useCallback(async (index: number | null) => {
    setSelectedAccountIndex(index);
    setContactsError(null);
    setGeneratedEmails(new Map()); // Clear previous emails

    if (index === null) {
      setContacts([]);
      setSelectedContactIds([]);
      setFullAccountData(null);
      setFullContactsData([]);
      return;
    }

    setIsLoadingContacts(true);

    try {
      // Fetch contacts (list items for selector)
      const contactsResponse = await fetch(`/api/contacts/${index}`);
      if (!contactsResponse.ok) {
        throw new Error('Failed to fetch contacts');
      }
      const contactData = await contactsResponse.json() as ContactListItem[];
      setContacts(contactData);

      // Fetch full contacts data for generation
      const fullContactsResponse = await fetch(`/api/contacts/${index}?full=true`);
      if (fullContactsResponse.ok) {
        const fullData = await fullContactsResponse.json() as Contact[];
        setFullContactsData(fullData);
      }

      // Fetch full account data for generation
      const accountResponse = await fetch(`/api/accounts/${index}`);
      if (accountResponse.ok) {
        const accountData = await accountResponse.json() as Account;
        setFullAccountData(accountData);
      }

      // ContactSelector will handle auto-selection via its useEffect
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setContactsError('Failed to load contacts');
      setContacts([]);
      setSelectedContactIds([]);
      setFullAccountData(null);
      setFullContactsData([]);
    } finally {
      setIsLoadingContacts(false);
    }
  }, []);

  const handleSelectionChange = useCallback((ids: string[]) => {
    setSelectedContactIds(ids);
  }, []);

  const handleEmailsGenerated = useCallback((emails: Map<string, EmailSequence>) => {
    setGeneratedEmails(emails);
    // Trigger history panel refresh when new emails are generated
    setHistoryRefreshKey((k) => k + 1);
  }, []);

  // View email handler - fetch full email content
  const handleViewEmail = useCallback(async (id: string) => {
    setViewingEmailId(id);
    setViewingEmailLoading(true);
    setViewingEmail(null);

    try {
      const response = await fetch(`/api/emails/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch email');
      }
      const data = (await response.json()) as SavedEmail;
      setViewingEmail(data);
    } catch (error) {
      console.error('Error fetching email:', error);
      setViewingEmail(null);
    } finally {
      setViewingEmailLoading(false);
    }
  }, []);

  const handleCloseViewing = useCallback(() => {
    setViewingEmailId(null);
    setViewingEmail(null);
  }, []);

  const selectedAccount = selectedAccountIndex !== null
    ? accounts.find((a) => a.index === selectedAccountIndex)
    : null;

  // Get selected contacts for EmailGenerator
  const selectedContacts = contacts.filter(c => selectedContactIds.includes(c.contact_id));

  // Determine history filter - show all or current account
  const historyAccountIndex = showAllAccounts ? null : selectedAccountIndex;

  return (
    <>
      {/* LEFT COLUMN: Sticky Controls */}
      <aside className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-scroll space-y-4">
        {/* Account Selection */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-class-purple">
            Account Selection
          </h2>
          <div className="rounded-lg border border-class-light-purple bg-white p-4">
            <AccountSelector
              accounts={accounts}
              selectedIndex={selectedAccountIndex}
              onSelect={handleAccountSelect}
            />

            {selectedAccount && (
              <div className="mt-3 rounded-lg bg-class-light-purple/30 p-3">
                <h3 className="font-medium text-class-navy">
                  {selectedAccount.company_name}
                </h3>
                <p className="mt-1 text-sm text-class-navy/70">
                  Tier {selectedAccount.tier} | {selectedAccount.ehr_system} |{' '}
                  {selectedAccount.employee_count.toLocaleString()} employees
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Account Intelligence (collapsible, closed by default on desktop) */}
        {fullAccountData && (
          <section>
            <details className="group">
              <summary className="mb-3 cursor-pointer text-lg font-bold text-class-purple list-none flex items-center gap-2">
                <span className="text-class-purple/60 transition-transform group-open:rotate-90">▶</span>
                Account Intelligence
              </summary>
              <AccountIntelligencePanel account={fullAccountData} />
            </details>
          </section>
        )}

        {/* Contact Selection */}
        {selectedAccountIndex !== null && (
          <section>
            <h2 className="mb-3 text-lg font-bold text-class-purple">
              Contact Selection
            </h2>
            <div className="rounded-lg border border-class-light-purple bg-white p-4">
              {isLoadingContacts ? (
                <div className="flex items-center justify-center py-6">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-class-purple border-t-transparent" />
                  <span className="ml-2 text-sm text-class-navy/70">Loading contacts...</span>
                </div>
              ) : contactsError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center">
                  <p className="text-sm text-red-600">{contactsError}</p>
                </div>
              ) : (
                <ContactSelector
                  contacts={contacts}
                  selectedIds={selectedContactIds}
                  onSelectionChange={handleSelectionChange}
                />
              )}
            </div>
          </section>
        )}

        {/* Email Generation Button */}
        {selectedAccount && (
          <section>
            <h2 className="mb-3 text-lg font-bold text-class-purple">
              Email Generation
            </h2>
            <div className="rounded-lg border border-class-light-purple bg-white p-4">
              <EmailGenerator
                account={selectedAccount}
                contacts={selectedContacts}
                fullAccountData={fullAccountData}
                fullContactsData={fullContactsData}
                onEmailsGenerated={handleEmailsGenerated}
              />
            </div>
          </section>
        )}
      </aside>

      {/* RIGHT COLUMN: Scrollable Content */}
      <main className="space-y-6">
        {/* Generated Emails */}
        <section>
          <h2 className="mb-4 text-lg font-bold text-class-purple">
            Generated Emails
          </h2>
          {generatedEmails.size > 0 ? (
            <div className="space-y-6">
              {Array.from(generatedEmails.entries()).map(([contactId, emails]) => {
                const contact = contacts.find(c => c.contact_id === contactId);
                const fullContact = fullContactsData.find(c => c.contact_id === contactId);
                return (
                  <EmailSequenceDisplay
                    key={contactId}
                    accountIndex={selectedAccountIndex!}
                    contactId={contactId}
                    contactName={contact?.full_name ?? 'Unknown Contact'}
                    contactTitle={contact?.title ?? ''}
                    contactEmail={fullContact?.email ?? contact?.email ?? ''}
                    contactPhone={fullContact?.phone ?? null}
                    accountName={selectedAccount?.company_name ?? ''}
                    emails={emails}
                  />
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-class-light-purple bg-class-light-purple/30 p-6">
              <p className="text-class-navy/60">
                Generated email sequences will appear here after selecting an
                account and contacts.
              </p>
            </div>
          )}
        </section>

        {/* Email History (collapsible) */}
        <section>
          <details open={generatedEmails.size === 0}>
            <summary className="mb-4 cursor-pointer text-lg font-bold text-class-purple list-none flex items-center gap-2">
              <span className="text-class-purple/60 transition-transform [details[open]>&]:rotate-90">▶</span>
              📁 Email History
            </summary>

            <div className="rounded-lg border border-class-light-purple bg-white p-4">
              {/* Filter toggle */}
              <div className="mb-4 flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-class-navy">
                  <input
                    type="checkbox"
                    checked={showAllAccounts}
                    onChange={(e) => setShowAllAccounts(e.target.checked)}
                    className="h-4 w-4 rounded border-class-light-purple text-class-purple focus:ring-class-purple"
                  />
                  Show all accounts
                </label>
                {selectedAccountIndex !== null && !showAllAccounts && (
                  <span className="text-sm text-class-navy/60">
                    Showing: {selectedAccount?.company_name}
                  </span>
                )}
              </div>

              {/* Viewing email detail */}
              {viewingEmailId && (
                <div className="mb-6 rounded-lg border border-class-light-purple bg-class-light-purple/20 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-medium text-class-navy">
                      Saved Email Detail
                    </h3>
                    <button
                      onClick={handleCloseViewing}
                      className="rounded bg-class-navy/10 px-3 py-1 text-sm text-class-navy hover:bg-class-navy/20"
                    >
                      Close
                    </button>
                  </div>

                  {viewingEmailLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-class-purple border-t-transparent" />
                      <span className="ml-2 text-class-navy/70">Loading...</span>
                    </div>
                  ) : viewingEmail ? (
                    <div>
                      <div className="mb-3 text-sm text-class-navy/70">
                        <strong>{viewingEmail.accountName}</strong> →{' '}
                        {viewingEmail.contactName} ({viewingEmail.contactTitle})
                        <br />
                        Saved: {new Date(viewingEmail.createdAt).toLocaleString()}
                      </div>
                      <div className="space-y-4">
                        {viewingEmail.emails.map((email, idx) => (
                          <div
                            key={email.variant_id}
                            className="rounded border border-class-light-purple bg-white p-4"
                          >
                            <div className="mb-2 text-sm font-medium text-class-purple">
                              Email {idx + 1}: {email.angle} angle ({email.word_count} words)
                            </div>
                            <div className="mb-2 font-medium text-class-navy">
                              Subject: {email.subject_line}
                            </div>
                            <div className="whitespace-pre-wrap text-sm text-class-navy/80">
                              {email.body}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-red-600">Failed to load email</p>
                  )}
                </div>
              )}

              {/* History panel */}
              <EmailHistoryPanel
                key={historyRefreshKey}
                accountIndex={historyAccountIndex}
                onViewEmail={handleViewEmail}
              />
            </div>
          </details>
        </section>
      </main>
    </>
  );
}
