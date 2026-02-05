'use client';

import EmailCard from '@/components/EmailCard';
import ExportButton from '@/components/ExportButton';
import SaveButton from '@/components/SaveButton';
import type { EmailSequence } from '@/lib/email-generator';

interface EmailSequenceDisplayProps {
  accountIndex: number;
  contactId: string;
  contactName: string;
  contactTitle: string;
  contactEmail: string;
  contactPhone: string | null;
  accountName: string;
  emails: EmailSequence;
  onSaved?: (id: string) => void;
}

/**
 * EmailSequenceDisplay component
 *
 * Renders a contact's 3-email sequence as vertically stacked EmailCards.
 * Shows contact header, 3 email cards, and Export to Word button.
 */
export default function EmailSequenceDisplay({
  accountIndex,
  contactId,
  contactName,
  contactTitle,
  contactEmail,
  contactPhone,
  accountName,
  emails,
  onSaved,
}: EmailSequenceDisplayProps) {
  return (
    <div className="rounded-xl border border-class-light-purple bg-white p-6">
      {/* Contact Header */}
      <div className="mb-6 border-b border-class-light-purple pb-4">
        <h3 className="text-lg font-bold text-class-navy">
          {contactName}
        </h3>
        <div className="mt-3 space-y-1 text-sm text-class-navy/80">
          <p><span className="font-medium">Title:</span> {contactTitle}</p>
          <p><span className="font-medium">Email:</span> {contactEmail}</p>
          {contactPhone && <p><span className="font-medium">Phone:</span> {contactPhone}</p>}
        </div>
        <p className="mt-3 text-sm text-class-navy/60">
          3-email sequence ({emails.length} emails)
        </p>
      </div>

      {/* Email Cards - Vertical Stack */}
      <div className="flex flex-col gap-4">
        {emails.map((email) => (
          <EmailCard
            key={`${contactId}-E${email.email_number}`}
            email={email}
            contactName={contactName}
          />
        ))}
      </div>

      {/* Action Buttons Footer */}
      <div className="mt-6 flex justify-end gap-3 border-t border-class-light-purple pt-4">
        <SaveButton
          accountIndex={accountIndex}
          accountName={accountName}
          contactId={contactId}
          contactName={contactName}
          contactTitle={contactTitle}
          emails={emails}
          onSaved={onSaved}
        />
        <ExportButton
          contactId={contactId}
          contactName={contactName}
          contactTitle={contactTitle}
          accountName={accountName}
          emails={emails}
        />
      </div>
    </div>
  );
}
