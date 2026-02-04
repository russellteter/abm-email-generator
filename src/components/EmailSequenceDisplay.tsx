'use client';

import EmailCard from '@/components/EmailCard';
import ExportButton from '@/components/ExportButton';
import type { EmailSequence } from '@/lib/email-generator';

interface EmailSequenceDisplayProps {
  contactId: string;
  contactName: string;
  contactTitle: string;
  accountName: string;
  emails: EmailSequence;
}

/**
 * EmailSequenceDisplay component
 *
 * Renders a contact's 3-email sequence as vertically stacked EmailCards.
 * Shows contact header, 3 email cards, and Export to Word button.
 */
export default function EmailSequenceDisplay({
  contactId,
  contactName,
  contactTitle,
  accountName,
  emails,
}: EmailSequenceDisplayProps) {
  return (
    <div className="rounded-xl border border-class-light-purple bg-white p-6">
      {/* Contact Header */}
      <div className="mb-6 border-b border-class-light-purple pb-4">
        <h3 className="text-lg font-bold text-class-navy">
          {contactName}
        </h3>
        <p className="mt-1 text-sm text-class-navy/60">
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

      {/* Export Button Footer */}
      <div className="mt-6 flex justify-end border-t border-class-light-purple pt-4">
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
