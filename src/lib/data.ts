import { promises as fs } from 'fs';
import path from 'path';
import type {
  Account,
  AccountsFile,
  AccountListItem,
  Contact,
  ContactFile,
  ContactListItem,
  SendersConfig,
} from './types';

// Base path from abm-email-generator to campaign-data
function getCampaignDataPath(...segments: string[]): string {
  return path.join(process.cwd(), '..', 'campaign-data', ...segments);
}

// ============ Account Loaders ============

export async function loadAllAccounts(): Promise<Account[]> {
  try {
    const content = await fs.readFile(
      getCampaignDataPath('accounts', 'accounts.json'),
      'utf-8'
    );
    const data = JSON.parse(content) as AccountsFile;
    return data.accounts;
  } catch (error) {
    console.error('Failed to load accounts.json:', error);
    return [];
  }
}

export async function loadAccount(index: number): Promise<Account | null> {
  const accounts = await loadAllAccounts();
  return accounts.find((a) => a.index === index) ?? null;
}

export async function getAccountListItems(): Promise<AccountListItem[]> {
  const accounts = await loadAllAccounts();
  return accounts.map((a) => ({
    index: a.index,
    company_name: a.company_name,
    tier: a.tier,
    ehr_system: a.ehr_system,
    employee_count: a.employee_count,
  }));
}

// ============ Contact Loaders ============

export async function loadContactsForAccount(
  accountIndex: number
): Promise<Contact[]> {
  // Account index maps to file: index 1 -> account-001.json
  const paddedIndex = String(accountIndex).padStart(3, '0');
  const filePath = getCampaignDataPath('contacts', `account-${paddedIndex}.json`);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const contactFile = JSON.parse(content) as ContactFile;
    return contactFile.contacts.sort(
      (a, b) => a.outreach_priority - b.outreach_priority
    );
  } catch {
    // Contact file doesn't exist for this account
    return [];
  }
}

export async function getContactListItems(
  accountIndex: number
): Promise<ContactListItem[]> {
  const contacts = await loadContactsForAccount(accountIndex);
  return contacts.map((c) => ({
    contact_id: c.contact_id,
    full_name: c.full_name,
    title: c.title,
    email: c.email,
    persona_match: c.persona_match,
    outreach_priority: c.outreach_priority,
  }));
}

export async function hasContacts(accountIndex: number): Promise<boolean> {
  const contacts = await loadContactsForAccount(accountIndex);
  return contacts.length > 0;
}

// ============ Config Loaders ============

export async function loadSendersConfig(): Promise<SendersConfig | null> {
  try {
    const content = await fs.readFile(
      getCampaignDataPath('config', 'senders.json'),
      'utf-8'
    );
    return JSON.parse(content) as SendersConfig;
  } catch {
    return null;
  }
}
