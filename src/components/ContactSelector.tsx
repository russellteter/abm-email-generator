'use client';

import { useEffect, useRef } from 'react';
import type { ContactListItem } from '@/lib/types';

interface ContactSelectorProps {
  contacts: ContactListItem[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

// =============================================================================
// EXCLUSION PATTERNS - These roles should NEVER be auto-selected
// =============================================================================
const EXCLUDED_KEYWORDS = [
  'CEO', 'Chief Executive',
  'CMO', 'Chief Medical Officer',
  'CFO', 'Chief Financial',
  'COO', 'Chief Operating',
  'CMIO', 'Chief Medical Information',
  'CNO', 'Chief Nursing',
  'Epic Trainer', 'Credentialed Trainer', 'Training Specialist', 'EHR Trainer'
];

// =============================================================================
// PRIORITY KEYWORDS - Contacts to auto-select (in priority order)
// =============================================================================
// Tier 1 - CLO (Chief Learning Officer)
const TIER_1_KEYWORDS = ['CLO', 'Chief Learning', 'VP Learning', 'VP L&D'];

// Tier 2 - CIO (Chief Information Officer)
const TIER_2_KEYWORDS = ['CIO', 'Chief Information Officer', 'Chief Digital'];

// Tier 3 - CHRO (Chief Human Resources Officer)
const TIER_3_KEYWORDS = ['CHRO', 'Chief Human Resources', 'Chief People', 'CPO'];

// Tier 4 - L&D Directors
const TIER_4_KEYWORDS = [
  'Director of Learning', 'Director of Training', 'Director of L&D',
  'Director of Education', 'Director of Clinical Education',
  'VP Education', 'VP Training', 'Director of Workforce'
];

// Combined priority keywords for auto-selection
const ALL_PRIORITY_KEYWORDS = [
  ...TIER_1_KEYWORDS,
  ...TIER_2_KEYWORDS,
  ...TIER_3_KEYWORDS,
  ...TIER_4_KEYWORDS
];

function isExcluded(contact: ContactListItem): boolean {
  const combined = `${contact.title} ${contact.persona_match}`.toLowerCase();
  return EXCLUDED_KEYWORDS.some((kw) => combined.includes(kw.toLowerCase()));
}

function getPriorityTier(contact: ContactListItem): number | null {
  if (isExcluded(contact)) {
    return null; // Excluded contacts have no tier
  }

  const title = contact.title.toLowerCase();

  // Check tiers in order
  if (TIER_1_KEYWORDS.some((kw) => title.includes(kw.toLowerCase()))) {
    return 1;
  }
  if (TIER_2_KEYWORDS.some((kw) => title.includes(kw.toLowerCase()))) {
    return 2;
  }
  if (TIER_3_KEYWORDS.some((kw) => title.includes(kw.toLowerCase()))) {
    return 3;
  }
  if (TIER_4_KEYWORDS.some((kw) => title.includes(kw.toLowerCase()))) {
    return 4;
  }

  return 5; // Other eligible contacts
}

function shouldAutoSelect(contact: ContactListItem): boolean {
  // Never auto-select excluded contacts
  if (isExcluded(contact)) {
    return false;
  }

  const combined = `${contact.title} ${contact.persona_match}`.toLowerCase();

  // Auto-select if matches any priority keyword
  return ALL_PRIORITY_KEYWORDS.some((kw) => combined.includes(kw.toLowerCase()));
}

function getAutoSelectedIds(contacts: ContactListItem[]): string[] {
  return contacts
    .filter((contact) => shouldAutoSelect(contact))
    .map((contact) => contact.contact_id);
}

// Sort contacts by priority tier (lowest tier first = highest priority)
function sortContacts(contacts: ContactListItem[]): ContactListItem[] {
  return [...contacts].sort((a, b) => {
    const tierA = getPriorityTier(a);
    const tierB = getPriorityTier(b);

    // Excluded contacts go to the bottom
    if (tierA === null && tierB === null) return 0;
    if (tierA === null) return 1;
    if (tierB === null) return -1;

    // Sort by tier (lower is better)
    if (tierA !== tierB) return tierA - tierB;

    // Within same tier, sort by original outreach_priority
    return a.outreach_priority - b.outreach_priority;
  });
}

function getTierLabel(tier: number | null): string {
  if (tier === null) return 'Excluded';
  const labels: Record<number, string> = {
    1: 'CLO',
    2: 'CIO',
    3: 'CHRO',
    4: 'L&D Dir',
    5: 'Other'
  };
  return labels[tier] || 'Other';
}

function getTierColor(tier: number | null): string {
  if (tier === null) return 'bg-red-100 text-red-700';
  const colors: Record<number, string> = {
    1: 'bg-green-100 text-green-700',
    2: 'bg-blue-100 text-blue-700',
    3: 'bg-purple-100 text-purple-700',
    4: 'bg-yellow-100 text-yellow-700',
    5: 'bg-gray-100 text-gray-600'
  };
  return colors[tier] || 'bg-gray-100 text-gray-600';
}

export default function ContactSelector({
  contacts,
  selectedIds,
  onSelectionChange,
}: ContactSelectorProps) {
  const sortedContacts = sortContacts(contacts);
  const prevContactsRef = useRef<string>('');

  // Auto-select on mount and when contacts change
  useEffect(() => {
    const contactsKey = contacts.map((c) => c.contact_id).join(',');

    // Only run auto-select when contacts actually change
    if (contactsKey !== prevContactsRef.current) {
      prevContactsRef.current = contactsKey;

      if (contacts.length > 0) {
        const autoSelected = getAutoSelectedIds(contacts);
        onSelectionChange(autoSelected);
      } else {
        onSelectionChange([]);
      }
    }
  }, [contacts, onSelectionChange]);

  const handleToggle = (contactId: string) => {
    if (selectedIds.includes(contactId)) {
      onSelectionChange(selectedIds.filter((id) => id !== contactId));
    } else {
      onSelectionChange([...selectedIds, contactId]);
    }
  };

  const handleSelectAll = () => {
    // Only select non-excluded contacts
    const eligibleIds = contacts
      .filter((c) => !isExcluded(c))
      .map((c) => c.contact_id);
    onSelectionChange(eligibleIds);
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  if (contacts.length === 0) {
    return (
      <div className="rounded-lg border border-class-light-purple bg-class-light-purple/20 p-6 text-center">
        <p className="text-class-navy/60">
          No contacts available for this account
        </p>
      </div>
    );
  }

  const eligibleContacts = sortedContacts.filter((c) => !isExcluded(c));

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <label className="text-sm font-medium text-class-navy">
          Select Contacts ({selectedIds.length} of {eligibleContacts.length})
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSelectAll}
            className="rounded px-3 py-1 text-sm text-class-purple hover:bg-class-light-purple transition-colors"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="rounded px-3 py-1 text-sm text-class-purple hover:bg-class-light-purple transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto rounded-lg border border-class-light-purple p-2">
        {eligibleContacts.map((contact) => {
          const isSelected = selectedIds.includes(contact.contact_id);
          const tier = getPriorityTier(contact);

          return (
            <label
              key={contact.contact_id}
              className={`flex cursor-pointer items-start gap-3 rounded-lg p-3 transition-colors ${
                isSelected
                  ? 'bg-class-light-purple'
                  : 'bg-white hover:bg-class-light-purple/50'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleToggle(contact.contact_id)}
                className="mt-1 h-4 w-4 rounded border-class-navy/30 text-class-purple focus:ring-class-purple/30"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="font-medium text-class-navy truncate"
                    title={`${contact.full_name} — ${contact.title}`}
                  >
                    {contact.full_name}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getTierColor(tier)}`}>
                    {getTierLabel(tier)}
                  </span>
                </div>
                <div
                  className="text-sm text-class-navy/70 truncate"
                  title={contact.title}
                >
                  {contact.title}
                </div>
                <div
                  className="text-sm text-class-navy/60 truncate"
                  title={contact.email}
                >
                  {contact.email}
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
