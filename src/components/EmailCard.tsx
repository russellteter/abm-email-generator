'use client';

import type { EmailVariant } from '@/lib/email-generator';

interface EmailCardProps {
  email: EmailVariant;
  contactName: string;
}

/**
 * Email number color coding
 * - Email 1: Purple bg #EBE9FC, border #4739E7
 * - Email 2: Blue bg #E0F2FE, border #0284C7
 * - Email 3: Green bg #ECFDF5, border #059669
 */
const emailColors: Record<1 | 2 | 3, { bg: string; border: string; text: string }> = {
  1: { bg: 'bg-[#EBE9FC]', border: 'border-[#4739E7]', text: 'text-[#4739E7]' },
  2: { bg: 'bg-[#E0F2FE]', border: 'border-[#0284C7]', text: 'text-[#0284C7]' },
  3: { bg: 'bg-[#ECFDF5]', border: 'border-[#059669]', text: 'text-[#059669]' },
};

/**
 * EmailCard component
 *
 * Displays a single email with glassmorphic styling and color-coded header.
 * Shows full email body, subject line, and word count validation badge.
 */
export default function EmailCard({ email, contactName }: EmailCardProps) {
  const colors = emailColors[email.email_number];
  const isWordCountValid = email.word_count >= 150 && email.word_count <= 200;

  return (
    <div
      className="relative overflow-hidden rounded-xl"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(246,246,254,0.9) 100%)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(71, 57, 231, 0.08)',
        boxShadow: '0 4px 6px -1px rgba(71, 57, 231, 0.06), 0 2px 4px -1px rgba(71, 57, 231, 0.04)',
      }}
    >
      {/* Header Row: Email number badge + Subject line */}
      <div className={`flex items-center gap-3 border-b ${colors.border} border-opacity-20 px-4 py-3`}>
        {/* Email number badge */}
        <span
          className={`inline-flex items-center rounded-full ${colors.bg} ${colors.border} border px-3 py-1 text-sm font-semibold ${colors.text}`}
        >
          Email {email.email_number}
        </span>

        {/* Subject line */}
        <span className="flex-1 font-medium text-class-navy truncate" title={email.subject_line}>
          {email.subject_line}
        </span>
      </div>

      {/* Body: Full email text */}
      <div className="px-4 py-4">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-class-navy/90">
          {email.body}
        </p>
      </div>

      {/* Footer: Word count badge */}
      <div className="flex items-center justify-between border-t border-class-light-purple px-4 py-2">
        <span className="text-xs text-class-navy/50">
          For: {contactName}
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
            isWordCountValid
              ? 'bg-green-100 text-green-700'
              : 'bg-amber-100 text-amber-700'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isWordCountValid ? 'bg-green-500' : 'bg-amber-500'
            }`}
          />
          {email.word_count} words
          {!isWordCountValid && (
            <span className="ml-0.5 text-[10px]">
              ({email.word_count < 150 ? 'under' : 'over'} limit)
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
