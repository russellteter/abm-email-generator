'use client';

import type { AccountListItem } from '@/lib/types';

interface AccountSelectorProps {
  accounts: AccountListItem[];
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
}

// Sort accounts alphabetically by company name
function sortAccounts(accounts: AccountListItem[]): AccountListItem[] {
  return [...accounts].sort((a, b) => {
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
            {account.company_name}
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
