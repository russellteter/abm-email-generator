'use client';

import { useEffect, useRef } from 'react';
import type { ContactListItem } from '@/lib/types';

interface ContactSelectorProps {
  contacts: ContactListItem[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

// Keywords for auto-select (case-insensitive)
const IT_DIGITAL_KEYWORDS = ['CIO', 'IT ', 'Technology', 'Information', 'Technical', 'Digital'];
const CLINICAL_KEYWORDS = ['Clinical', 'Nurse', 'Medical', 'CMO', 'CMIO', 'CNO'];

function shouldAutoSelect(personaMatch: string): boolean {
  const lowerPersona = personaMatch.toLowerCase();

  const allKeywords = [...IT_DIGITAL_KEYWORDS, ...CLINICAL_KEYWORDS];
  return allKeywords.some((keyword) =>
    lowerPersona.includes(keyword.toLowerCase())
  );
}

function getAutoSelectedIds(contacts: ContactListItem[]): string[] {
  return contacts
    .filter((contact) => shouldAutoSelect(contact.persona_match))
    .map((contact) => contact.contact_id);
}

// Sort contacts by outreach_priority (lowest first = highest priority)
function sortContacts(contacts: ContactListItem[]): ContactListItem[] {
  return [...contacts].sort((a, b) => a.outreach_priority - b.outreach_priority);
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
    onSelectionChange(contacts.map((c) => c.contact_id));
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

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <label className="text-sm font-medium text-class-navy">
          Select Contacts ({selectedIds.length} of {contacts.length} selected)
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
        {sortedContacts.map((contact) => {
          const isSelected = selectedIds.includes(contact.contact_id);

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
                <div className="font-medium text-class-navy truncate">
                  {contact.full_name} — {contact.title}
                </div>
                <div className="text-sm text-class-navy/60 truncate">
                  {contact.persona_match}
                </div>
                <div className="text-xs text-class-navy/40 truncate">
                  {contact.email}
                </div>
              </div>
              <div className="text-xs text-class-navy/40 shrink-0">
                Priority: {contact.outreach_priority}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
