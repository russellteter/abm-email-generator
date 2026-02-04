// Account types from Google Sheets export

export interface Account {
  index: number; // 1-46, maps to contact file (account-001.json)
  company_name: string;
  domain: string;
  tier: string; // "A+", "A", "B", etc.
  employee_count: number;
  tier_rationale: string;
  timing_signals: string;
  qualification_summary: string;
  evidence_summary: string;
  ehr_system: string; // "Epic", "Cerner", etc.
  ehr_stage: string;
  ehr_go_live_date: string;
  lms: string;
  video_conferencing_tools: string;
  key_timing_signals: string;
  news_summary: string;
  icp_qualification_summary: string;
  account_id: string; // "ACC_355089225_..."
}

export interface AccountsFile {
  exported_at: string;
  source_spreadsheet: string;
  total_accounts: number;
  accounts: Account[];
}

// Simplified for UI dropdown
export interface AccountListItem {
  index: number;
  company_name: string;
  tier: string;
  ehr_system: string;
  employee_count: number;
}

// Contact types from contact discovery files

export interface DoNotCall {
  direct: boolean;
  mobile: boolean;
}

export interface Contact {
  contact_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  title: string;
  department: string;
  management_level: string;
  email: string;
  email_confidence: number;
  phone: string | null;
  mobile_phone: string | null;
  linkedin_url: string | null;
  location: string;
  years_in_role: number | null;
  total_experience: string;
  persona_match: string;
  relevance_notes: string;
  outreach_priority: number;
  do_not_call: DoNotCall;
}

export interface ContactSummary {
  total_contacts: number;
  primary_personas_found: number;
  email_coverage: string;
  decision_maker_coverage: string;
  recommended_entry_point: string;
}

export interface ContactFile {
  account_id: string;
  company_name: string;
  domain: string;
  discovery_timestamp: string;
  discovery_source: string;
  contacts: Contact[];
  contact_summary: ContactSummary;
  discovery_notes: string;
}

export interface ContactListItem {
  contact_id: string;
  full_name: string;
  title: string;
  email: string;
  persona_match: string;
  outreach_priority: number;
}

// Sender config types

export interface VoiceProfile {
  description: string;
  posture: string;
  tone: string;
  perspective: string;
  focus: string;
  formality: string;
  cta_style: string;
}

export interface EmailLength {
  target_words: number;
  min_words: number;
  max_words: number;
}

export interface CtaPatterns {
  allowed?: string[];
  banned?: string[];
  primary?: string[];
  avoid?: string[];
}

export interface Sender {
  sender_id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  role: string;
  voice_profile: VoiceProfile;
  signature: string;
  signature_note?: string;
  background_context: string;
  story_elements?: string[];
  credibility_points: string[];
  email_lengths: Record<string, EmailLength>;
  cta_patterns: CtaPatterns;
  three_part_structure?: Record<string, string>;
  authenticity_rules?: string[];
}

export interface VariantConfig {
  id_suffix: string;
  length: string;
  sender: string;
  reason?: string;
}

export interface VariantDifferentiation {
  primary_focus: string;
  angle: string;
  structure: string;
}

export interface SendersConfig {
  senders: Sender[];
  variant_matrix: {
    description: string;
    version: string;
    total_variants_per_account: number;
    variants: VariantConfig[];
    removed_in_v2: VariantConfig[];
  };
  variant_differentiation: Record<string, VariantDifferentiation>;
}
