'use client';

import { useState, useCallback } from 'react';
import AccountSelector from '@/components/AccountSelector';
import ContactSelector from '@/components/ContactSelector';
import EmailGenerator from '@/components/EmailGenerator';
import EmailSequenceDisplay from '@/components/EmailSequenceDisplay';
import type { AccountListItem, ContactListItem, Account, Contact } from '@/lib/types';
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
  }, []);

  const selectedAccount = selectedAccountIndex !== null
    ? accounts.find((a) => a.index === selectedAccountIndex)
    : null;

  // Get selected contacts for EmailGenerator
  const selectedContacts = contacts.filter(c => selectedContactIds.includes(c.contact_id));

  return (
    <>
      {/* Account Selection */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-bold text-class-purple">
          Account Selection
        </h2>
        <div className="rounded-lg border border-class-light-purple bg-white p-6">
          <AccountSelector
            accounts={accounts}
            selectedIndex={selectedAccountIndex}
            onSelect={handleAccountSelect}
          />

          {selectedAccount && (
            <div className="mt-4 rounded-lg bg-class-light-purple/30 p-4">
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

      {/* Contact Selection */}
      {selectedAccountIndex !== null && (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-bold text-class-purple">
            Contact Selection
          </h2>
          <div className="rounded-lg border border-class-light-purple bg-white p-6">
            {isLoadingContacts ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-class-purple border-t-transparent" />
                <span className="ml-3 text-class-navy/70">Loading contacts...</span>
              </div>
            ) : contactsError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
                <p className="text-red-600">{contactsError}</p>
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

      {/* Email Generation */}
      {selectedAccount && (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-bold text-class-purple">
            Email Generation
          </h2>
          <div className="rounded-lg border border-class-light-purple bg-white p-6">
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

      {/* Results Area - Generated Emails */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-class-purple">
          Generated Emails
        </h2>
        {generatedEmails.size > 0 ? (
          <div className="space-y-6">
            {Array.from(generatedEmails.entries()).map(([contactId, emails]) => {
              const contact = contacts.find(c => c.contact_id === contactId);
              return (
                <EmailSequenceDisplay
                  key={contactId}
                  accountIndex={selectedAccountIndex!}
                  contactId={contactId}
                  contactName={contact?.full_name ?? 'Unknown Contact'}
                  contactTitle={contact?.title ?? ''}
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
    </>
  );
}
