'use client';

import type { AccountListItem } from '@/lib/types';

interface AccountSelectorProps {
  accounts: AccountListItem[];
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
}

// Sort accounts by tier (A+ first, then A, then B) then by name
function sortAccounts(accounts: AccountListItem[]): AccountListItem[] {
  const tierOrder: Record<string, number> = {
    'A+': 1,
    'A': 2,
    'B': 3,
  };

  return [...accounts].sort((a, b) => {
    const tierA = tierOrder[a.tier] ?? 99;
    const tierB = tierOrder[b.tier] ?? 99;

    if (tierA !== tierB) {
      return tierA - tierB;
    }

    return a.company_name.localeCompare(b.company_name);
  });
}

export default function AccountSelector({
  accounts,
  selectedIndex,
  onSelect,
}: AccountSelectorProps) {
  const sortedAccounts = sortAccounts(accounts);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === '') {
      onSelect(null);
    } else {
      onSelect(parseInt(value, 10));
    }
  };

  return (
    <div className="w-full">
      <label
        htmlFor="account-selector"
        className="mb-2 block text-sm font-medium text-class-navy"
      >
        Select Account
      </label>
      <select
        id="account-selector"
        value={selectedIndex ?? ''}
        onChange={handleChange}
        className="w-full rounded-lg border border-class-light-purple bg-white px-4 py-3 text-class-navy transition-colors focus:border-class-purple focus:outline-none focus:ring-2 focus:ring-class-purple/30"
      >
        <option value="" disabled>
          Select an account...
        </option>
        {sortedAccounts.map((account) => (
          <option key={account.index} value={account.index}>
            {account.company_name} — {account.tier} — {account.ehr_system}
          </option>
        ))}
      </select>
      {selectedIndex !== null && (
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="mt-2 text-sm text-class-purple hover:text-class-purple/80 transition-colors"
        >
          Clear selection
        </button>
      )}
    </div>
  );
}
